# Guia de Publicação (para leigos) — sem terminal, só cliques

Objetivo: colocar o site no ar de graça (endereço `algo.vercel.app`), com o checkout do
Mercado Pago funcionando e entrega automática do Google Drive.

Você vai usar 2 sites gratuitos: **GitHub** (guarda os arquivos) e **Vercel** (publica).
Tempo: ~20 minutos. Não precisa instalar nada.

---

## PARTE 1 — Preparar o Google Drive (2 min)

Para cada uma das 2 pastas do Drive (Essencial e Combo):
1. Clique com botão direito na pasta → **Compartilhar**
2. Em "Acesso geral", troque para **"Qualquer pessoa com o link"**
3. Permissão: **Leitor (Visualizador)**
4. Pronto. (Você já tem os links.)

---

## PARTE 2 — Subir os arquivos no GitHub (8 min)

1. Crie uma conta grátis em https://github.com (se ainda não tem).
2. No canto superior direito, clique no **+** → **New repository**.
3. Dê um nome (ex: `figurinhas-copa`). Deixe **Public**. Clique **Create repository**.
4. Na página que abrir, clique no link **"uploading an existing file"**
   (ou aba **Add file → Upload files**).
5. Abra a pasta do projeto no seu computador
   (`/Users/omar/Desktop/figurinhas`). Selecione **TODOS** os arquivos e a pasta `api`
   e **arraste** para a área de upload do GitHub.
   - Confira que apareceram: `index.html`, `obrigado.html`, `package.json`,
     e a pasta `api` com 3 arquivos dentro.
6. Clique no botão verde **Commit changes**.

> NÃO suba nenhum arquivo com sua senha/token. Eles não existem no projeto de propósito —
> o token vai direto na Vercel (Parte 3).

---

## PARTE 3 — Publicar na Vercel (8 min)

1. Acesse https://vercel.com → **Sign Up** → escolha **Continue with GitHub**
   (entra usando a conta que você acabou de criar). É grátis.
2. Clique **Add New… → Project**.
3. Vai aparecer seu repositório `figurinhas-copa` → clique **Import**.
4. **ANTES de publicar**, abra a seção **Environment Variables** e adicione as 3 abaixo.
   Para cada uma: digite o **Name**, cole o **Value**, clique **Add**.

   | Name (copie igualzinho) | Value (o que colar) |
   |---|---|
   | `MP_ACCESS_TOKEN` | seu Access Token do Mercado Pago (começa com `APP_USR-...`) |
   | `DRIVE_URL_ESSENCIAL` | o link da pasta do Drive do pacote R$ 9,90 |
   | `DRIVE_URL_COMBO` | o link da pasta do Drive do pacote R$ 19,90 |

5. Clique **Deploy**. Espere ~1 minuto.
6. No fim aparece **"Congratulations"** e um botão **Visit** → esse é o seu site no ar!
   O endereço é algo como `https://figurinhas-copa.vercel.app`. Anote-o.

---

## PARTE 4 — Avisar o Mercado Pago (Webhook) (3 min)

1. Entre em https://www.mercadopago.com.br/developers → **Suas integrações** → sua aplicação.
2. Menu **Webhooks** (ou "Notificações").
3. No campo de URL, cole: `https://SEU-ENDERECO.vercel.app/api/webhook`
   (troque pelo endereço que você anotou na Parte 3).
4. Marque o evento **Pagamentos** e salve.

---

## PARTE 5 — Pixel do Facebook (opcional, 2 min)

Se for usar anúncios: no GitHub, abra `index.html` e `obrigado.html`, clique no lápis (editar),
e troque `SEU_PIXEL_ID` pelo número do seu Pixel. Commit. A Vercel republica sozinha.

---

## Como testar se funcionou

1. Abra seu site `.vercel.app`.
2. Clique em **Garantir por R$ 9,90** → deve abrir o checkout do Mercado Pago.
3. Pague (pode usar Pix de verdade com valor baixo, ou cartões de teste do MP).
4. Após aprovar, ele te leva sozinho para a página de obrigado, que mostra o botão do Drive.

---

## Importante (segurança)

- Seu **Access Token** e **Client Secret** que você enviou no chat: gere credenciais NOVAS
  no painel do Mercado Pago e use as novas. As antigas considere "vazadas".
- O token só fica na Vercel (Parte 3), nunca dentro dos arquivos do site.
- Para alterar qualquer texto do site depois: edite no GitHub → a Vercel republica automático.
