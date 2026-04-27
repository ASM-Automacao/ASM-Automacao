import { serverEnv } from "@/lib/env";
import { MetaWhatsAppProvider } from "@/lib/whatsapp/meta-provider";
import { MockWhatsAppProvider } from "@/lib/whatsapp/mock-provider";
import type { WhatsAppProvider } from "@/lib/whatsapp/types";

export function createWhatsAppProvider(): WhatsAppProvider {
  if (serverEnv.WHATSAPP_MODE === "mock") {
    return new MockWhatsAppProvider();
  }
  return new MetaWhatsAppProvider();
}
