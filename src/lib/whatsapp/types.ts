export type SendTextParams = {
  to: string;
  body: string;
  clientId?: string;
  campaignId?: string;
};

export type SendTemplateParams = {
  to: string;
  templateName?: string;
  languageCode?: string;
  clientId?: string;
  campaignId?: string;
};

export type SendResult = {
  providerMessageId?: string;
  status: string;
  raw?: unknown;
};

export interface WhatsAppProvider {
  sendTextMessage(params: SendTextParams): Promise<SendResult>;
  sendTemplateMessage(params: SendTemplateParams): Promise<SendResult>;
}
