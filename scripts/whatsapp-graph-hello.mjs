/**
 * Chama a Graph API da Meta (hello_world) como o curl do painel.
 * Uso: node --env-file=.env.local scripts/whatsapp-graph-hello.mjs [DDI+DDD+número] [en_US|pt_BR]
 * Ex.: node --env-file=.env.local scripts/whatsapp-graph-hello.mjs 5522997084112 pt_BR
 */
const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const version = process.env.WHATSAPP_API_VERSION || "v22.0";
const to = process.argv[2] || process.env.WHATSAPP_TEST_TO || "5511999999999";
const langArg = process.argv[3];
const lang =
  langArg === "pt_BR" || langArg === "en_US"
    ? langArg
    : process.env.WHATSAPP_HELLO_LANG === "pt_BR" || process.env.WHATSAPP_HELLO_LANG === "en_US"
      ? process.env.WHATSAPP_HELLO_LANG
      : "en_US";

if (!token || !phoneId) {
  console.error("Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env.local");
  process.exit(1);
}

const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
const body = {
  messaging_product: "whatsapp",
  to: String(to).replace(/\D/g, ""),
  type: "template",
  template: {
    name: "hello_world",
    language: { code: lang },
  },
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const json = await res.json();
console.log("HTTP", res.status);
console.log("URL (sem token):", url);
console.log("to:", body.to, "| template: hello_world | lang:", lang);
console.log(JSON.stringify(json, null, 2));
