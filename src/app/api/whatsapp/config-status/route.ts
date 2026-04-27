import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    whatsappMode: serverEnv.WHATSAPP_MODE,
    apiVersion: serverEnv.WHATSAPP_API_VERSION,
    hasAccessToken: Boolean(serverEnv.WHATSAPP_ACCESS_TOKEN),
    hasPhoneNumberId: Boolean(serverEnv.WHATSAPP_PHONE_NUMBER_ID),
    hasVerifyToken: Boolean(serverEnv.WHATSAPP_VERIFY_TOKEN),
    appUrl: publicEnv.NEXT_PUBLIC_APP_URL ?? null,
    webhookCallbackUrl: publicEnv.NEXT_PUBLIC_APP_URL
      ? `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/whatsapp/webhook`
      : null,
  });
}
