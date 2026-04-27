# Central Comercial ASM

Dashboard comercial para a operação da representante: clientes, produtos, tabelas, campanhas, mensagens WhatsApp (Meta Cloud API), respostas e pedidos.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS  
- Supabase (PostgreSQL)  
- Meta WhatsApp Cloud API (modo `meta`; mock técnico opcional com `WHATSAPP_MODE=mock`)

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha **sem** commitar segredos.

| Variável | Onde |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_*` | Público (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Somente servidor** |
| `WHATSAPP_ACCESS_TOKEN` | **Somente servidor** |
| `NEXT_PUBLIC_APP_URL` | URL base (ex.: `https://seu-dominio.vercel.app`) para montar o callback do webhook |

## Banco de dados (Supabase)

1. Projeto já existente — não recrie do zero.  
2. Aplique migrações em `supabase/migrations/` na ordem (inclui `20260427130000_whatsapp_meta_columns.sql` para `error_message`, `raw_response`, `raw_payload` e status `meta_sent`).  
3. Opcional: `supabase/seed.sql` para dados de desenvolvimento.

## WhatsApp Meta — configuração resumida

1. [Meta for Developers](https://developers.facebook.com/) → crie/selecione o app → produto **WhatsApp**.  
2. **Temporary access token** → copie para `WHATSAPP_ACCESS_TOKEN`.  
3. **Phone number ID** do número de teste → `WHATSAPP_PHONE_NUMBER_ID`.  
4. Defina um valor qualquer para `WHATSAPP_VERIFY_TOKEN` (mesmo valor ao configurar o webhook na Meta).  
5. `WHATSAPP_API_VERSION=v22.0` (ou a versão que a Meta indicar).  
6. `WHATSAPP_MODE=meta`  
7. Adicione o **número do destinatário** como número de teste no painel da Meta (obrigatório em ambiente de teste).  
8. Rode o app (`npm run dev`), abra **WhatsApp Meta** no menu e use **Enviar hello_world** (template oficial).  
9. Veja a seção **[Webhook na Meta (só no seu login)](#webhook-na-meta-só-no-seu-login)** abaixo.  
10. Responda pelo WhatsApp; verifique `inbound_messages` no Supabase e a página **Respostas**.

### Webhook na Meta (só no seu login)

O agente **não** acessa sua conta Meta: você precisa colar URL e token nos passos abaixo. O app já expõe `POST /api/whatsapp/webhook` (status **sent** / **delivered** / **read** / **failed** atualizam `outbound_messages` quando existe `provider_message_id`).

**1 — URL pública HTTPS**

A Meta **não** chama `http://localhost`. Escolha **uma** opção:

- **Produção:** faça deploy (ex.: Vercel), defina todas as envs do `.env.example` e use `NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app` (sem barra no final).
- **Só na sua máquina:** instale [ngrok](https://ngrok.com/) ou [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/). Ex.: `ngrok http 3000` → copie a URL `https://xxxx.ngrok-free.app`, coloque em `NEXT_PUBLIC_APP_URL` e **reinicie** o `npm run dev`.

**2 — Variáveis**

- `NEXT_PUBLIC_APP_URL` = mesma base usada na URL do webhook.  
- `WHATSAPP_VERIFY_TOKEN` = uma string secreta **sua** (ex.: `asm_webhook_2026`).

**3 — No Meta for Developers**

1. App → **WhatsApp** → **Configuração** (ou **Configuration**).  
2. **Webhook** → **Editar** / **Configure**.  
3. **URL de callback:** `https://SUA-BASE/api/whatsapp/webhook` (ex.: `https://abc.ngrok-free.app/api/whatsapp/webhook`).  
4. **Token de verificação:** exatamente o mesmo valor de `WHATSAPP_VERIFY_TOKEN`.  
5. Salve — a Meta fará um GET de verificação; se der erro, confira token e se a URL está acessível na internet.  
6. Em **Campos do webhook**, assine **`messages`** (inclui mensagens recebidas e **atualizações de status** de entrega).

**4 — Conferir se está funcionando**

- Envie um teste pelo app (**Configurações → WhatsApp Meta**).  
- Em **desenvolvimento**, o terminal do Next imprime `[whatsapp webhook]` com `statusEvents` (ids e status).  
- No **Supabase**, a linha em `outbound_messages` deve mudar de `meta_sent` para `sent` / `delivered` / `read` ou `failed` com `error_message` quando a Meta notificar falha.

**Nota:** o **Insights** do Gerenciador do WhatsApp pode **atrasar** ou **não refletir** tráfego de **conta de teste**; para debug por mensagem use webhook + Supabase, não só o painel de métricas.

**Mensagem “enviada” mas não aparece no celular**

1. Abra o chat com o **número de teste da empresa** (ex.: +1 555… no painel Meta), não com outro contato.  
2. Confirme o número no campo da app: use só dígitos; `022…` é normalizado para `55…`.  
3. No teste de template, tente **pt_BR** se **en_US** não entregar.  
4. No Supabase, tabela **`outbound_messages`**: veja `status` (`delivered` / `failed`) e `error_message` após o webhook estar configurado.

## GitHub e Vercel

1. No GitHub: **Novo repositório** (pode ser vazio; branch `main`).  
2. Na pasta do projeto:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

3. **Quando aparecer pedido de login do GitHub:** use o **Git Credential Manager** (Windows costuma abrir o navegador) ou um **Personal Access Token (classic)** com escopo `repo` no lugar da senha, se o Git pedir usuário/senha no terminal.  
4. Na **Vercel**: Importar o repositório → framework **Next.js** → em **Environment Variables** cadastre as mesmas chaves do `.env.example` / do seu `.env.local` (nunca commite `.env.local`).

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Rotas úteis da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/whatsapp/config-status` | Status da config (sem expor tokens) |
| POST | `/api/whatsapp/test-template` | Envia template `hello_world` |
| POST | `/api/whatsapp/test-text` | Envia texto livre |
| GET | `/api/whatsapp/webhook` | Verificação Meta (`hub.challenge`) |
| POST | `/api/whatsapp/webhook` | Recebe mensagens e status |
| POST | `/api/price-tables/parse` | Parse de tabela bruta |
| POST | `/api/campaigns/send-table` | Campanha tabela (grava outbound) |
| POST | `/api/campaigns/send-promotion` | Campanha promoção |
| GET | `/api/export/orders` | CSV de pedidos |
| PATCH | `/api/inbound-messages/:id` | Atualiza status da resposta |
| POST | `/api/inbound-messages/:id/convert-order` | Cria pedido a partir da resposta |

## Segurança

- Tokens da Meta e `SUPABASE_SERVICE_ROLE_KEY` só em variáveis de ambiente no servidor.  
- A UI **WhatsApp Meta** mostra apenas “configurado sim/não”.  
- Em **desenvolvimento**, o servidor loga um resumo (`inbound`, `statuses`, `statusEvents`) — não o payload inteiro.

## Próximos passos sugeridos

- CRUD de clientes/produtos na UI com normalização de telefone ao salvar.  
- Auth Supabase + RLS por usuário (hoje há políticas amplas para `authenticated`).  
- Upload de imagens (buckets `product-images` / `campaign-images`) com políticas de Storage.
