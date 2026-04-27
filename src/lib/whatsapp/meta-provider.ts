import { serverEnv } from "@/lib/env";
import { sanitizeMetaErrorMessage } from "@/lib/whatsapp/sanitize-meta-error";
import type { SendResult, SendTemplateParams, SendTextParams, WhatsAppProvider } from "@/lib/whatsapp/types";

type MetaGraphResponse = {
  messages?: Array<{ id?: string }>;
  error?: { message?: string; code?: number; error_subcode?: number };
};

export class MetaWhatsAppProvider implements WhatsAppProvider {
  private async postToMeta(body: Record<string, unknown>): Promise<SendResult> {
    const token = serverEnv.WHATSAPP_ACCESS_TOKEN;
    if (!token) {
      return { status: "meta_not_configured", raw: { error: "missing_token" } };
    }

    const phoneId = serverEnv.WHATSAPP_PHONE_NUMBER_ID;
    if (!phoneId) {
      return { status: "meta_not_configured", raw: { error: "missing_phone_number_id" } };
    }

    const version = serverEnv.WHATSAPP_API_VERSION;
    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = (await res.json()) as MetaGraphResponse;

    if (!res.ok) {
      const msg = sanitizeMetaErrorMessage(raw.error?.message ?? res.statusText ?? "Erro Meta");
      return {
        status: "failed",
        raw,
        providerMessageId: undefined,
      };
    }

    const id = raw.messages?.[0]?.id;
    return {
      providerMessageId: id,
      status: "meta_sent",
      raw,
    };
  }

  async sendTextMessage(params: SendTextParams): Promise<SendResult> {
    const payload = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "text",
      text: {
        preview_url: false,
        body: params.body,
      },
    };
    return this.postToMeta(payload);
  }

  async sendTemplateMessage(params: SendTemplateParams): Promise<SendResult> {
    const templateName = params.templateName ?? "hello_world";
    const languageCode = params.languageCode ?? "en_US";

    const payload = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    return this.postToMeta(payload);
  }
}
