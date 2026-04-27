import type { SendTemplateParams, SendTextParams, WhatsAppProvider } from "@/lib/whatsapp/types";

/** Transporte simulado — persistência fica em `recordOutboundMessage` nas rotas. */
export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendTextMessage(params: SendTextParams) {
    return {
      providerMessageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "simulated_sent",
      raw: { transport: "mock", preview: params.body.slice(0, 80) },
    };
  }

  async sendTemplateMessage(params: SendTemplateParams) {
    const name = params.templateName ?? "hello_world";
    return {
      providerMessageId: `mock-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "simulated_sent",
      raw: { transport: "mock", template: name },
    };
  }
}
