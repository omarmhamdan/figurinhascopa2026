// Diagnóstico CAPI — dispara um evento de teste pra Meta e devolve a resposta crua.
// Abrir no navegador: /api/capi-test  → mostra se o token/pixel aceitam eventos de servidor.
// Usa evento "ServerHealthCheck" (custom) pra NÃO poluir os dados de Purchase.

import crypto from 'crypto';

export default async function handler(req, res) {
  const PIXEL_ID = '1464449862100173';
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return res.status(200).json({ ok: false, motivo: 'sem META_CAPI_TOKEN na Vercel' });

  const body = {
    data: [{
      event_name: 'ServerHealthCheck',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: 'https://figurinhascopa2026-bay.vercel.app/',
      user_data: { em: [crypto.createHash('sha256').update('teste@figurinhas.com').digest('hex')] }
    }]
  };
  if (req.query.test_code) body.test_event_code = req.query.test_code;

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    return res.status(200).json({ http_status: r.status, meta_resposta: d });
  } catch (e) {
    return res.status(200).json({ ok: false, erro: String(e) });
  }
}
