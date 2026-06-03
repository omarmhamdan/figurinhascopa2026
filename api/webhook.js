// Webhook do Mercado Pago — recebe avisos de pagamento.
// Quando o pagamento é APROVADO: envia e-mail (Brevo) + dispara Purchase
// na API de Conversões da Meta (CAPI, server-side).
// Sempre responde 200 rápido pro MP não reenviar.

import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const id = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);
    const topic = req.query.topic || req.query.type;

    if (id && (topic === 'payment' || !topic)) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      });
      const p = await r.json();
      console.log('[WEBHOOK]', p.id, p.status, p.external_reference, p.payer && p.payer.email);

      if (p.status === 'approved') {
        await enviarEmail(p);
        await enviarCapi(p);
      }
    }
  } catch (e) {
    console.error('[WEBHOOK] exceção', e);
  }
  res.status(200).send('ok');
}

async function enviarEmail(p) {
  const meta = p.metadata || {};
  // prioriza o e-mail que o cliente digitou no checkout (validado); fallback no payer do MP
  const email = String((meta.email || (p.payer && p.payer.email) || '')).trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  console.log('[EMAIL] checando', { email: email, emailOk: emailOk, temKey: !!process.env.BREVO_API_KEY, temSender: !!process.env.SENDER_EMAIL });
  if (!emailOk) { console.log('[EMAIL] e-mail do destinatário inválido:', email); return; }
  if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
    console.log('[EMAIL] Brevo não configurado (faltam BREVO_API_KEY / SENDER_EMAIL)');
    return;
  }

  const links = {
    essencial: process.env.DRIVE_URL_ESSENCIAL,
    combo:     process.env.DRIVE_URL_COMBO
  };
  const url = links[p.external_reference] || links.essencial;
  const nomePacote = p.external_reference === 'combo' ? 'Combo Completo' : 'Coleção Essencial';

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#12241a">
    <div style="background:linear-gradient(135deg,#0b8b3d,#066b2d);color:#fff;padding:28px;border-radius:14px 14px 0 0;text-align:center">
      <div style="font-size:34px">🏆</div>
      <h1 style="margin:8px 0 0;font-size:22px">Pagamento confirmado!</h1>
    </div>
    <div style="border:1px solid #e3e8dd;border-top:0;border-radius:0 0 14px 14px;padding:28px;text-align:center">
      <p style="font-size:15px;line-height:1.6">Obrigado pela compra do <b>${nomePacote} — Figurinhas Copa 2026</b>!<br>Sua coleção está liberada. Clique no botão abaixo para acessar:</p>
      <a href="${url}" style="display:inline-block;background:#f4b400;color:#12241a;font-weight:bold;text-decoration:none;padding:16px 32px;border-radius:10px;margin:18px 0;font-size:16px">📥 Acessar minha coleção</a>
      <p style="font-size:13px;color:#55665b;line-height:1.6">Salve este e-mail — o link funciona sempre. Qualquer dúvida, é só responder.</p>
    </div>
  </div>`;

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Figurinhas Copa 2026', email: process.env.SENDER_EMAIL },
        to: [{ email: email }],
        subject: '✅ Sua Coleção de Figurinhas da Copa 2026',
        htmlContent: html
      })
    });
    const data = await resp.json();
    if (!resp.ok) console.error('[BREVO] erro', data);
    else console.log('[BREVO] enviado para', email, data);
  } catch (e) {
    console.error('[BREVO] exceção', e);
  }
}

// ===== Meta — API de Conversões (server-side) =====
function sha256(v) {
  return crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
}

async function enviarCapi(p) {
  const PIXEL_ID = '1464449862100173';
  const token = process.env.META_CAPI_TOKEN;
  if (!token) { console.log('[CAPI] sem META_CAPI_TOKEN'); return; }

  const meta = p.metadata || {};
  const email = String(meta.email || (p.payer && p.payer.email) || '').trim().toLowerCase();
  const fone = String(meta.telefone || '').replace(/\D/g, '');
  const valor = p.transaction_amount || (p.external_reference === 'combo' ? 19.90 : 9.90);

  const user_data = {};
  if (email) user_data.em = [sha256(email)];
  if (fone) user_data.ph = [sha256('55' + fone)];

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: 'purchase_' + p.id,            // mesmo id do navegador → deduplica
      event_source_url: 'https://figurinhascopa2026-bay.vercel.app/obrigado.html',
      user_data: user_data,
      custom_data: { currency: 'BRL', value: valor }
    }]
  };
  // Validação na aba "Eventos de teste" do Gerenciador (setar META_CAPI_TEST_CODE; remover depois)
  if (process.env.META_CAPI_TEST_CODE) body.test_event_code = process.env.META_CAPI_TEST_CODE;

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) console.error('[CAPI] erro', d);
    else console.log('[CAPI] enviado', d);
  } catch (e) {
    console.error('[CAPI] exceção', e);
  }
}
