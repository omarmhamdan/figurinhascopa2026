// Webhook do Mercado Pago — recebe avisos de pagamento.
// Aqui você pode: enviar e-mail com o link, registrar a venda, etc.
// Sempre responde 200 rápido pro MP não ficar reenviando.

export default async function handler(req, res) {
  try {
    const id = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);
    const topic = req.query.topic || req.query.type;

    if (id && (topic === 'payment' || !topic)) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      });
      const p = await r.json();
      console.log('[WEBHOOK]', p.id, p.status, p.external_reference);

      if (p.status === 'approved') {
        // TODO (opcional): enviar e-mail com o link, gravar no banco, etc.
        // O comprador (do email do MP) está em p.payer && p.payer.email
      }
    }
  } catch (e) {
    console.error('[WEBHOOK] exceção', e);
  }
  // responde sempre 200
  res.status(200).send('ok');
}
