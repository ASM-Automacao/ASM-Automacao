export function isOutboundSendSuccess(status: string): boolean {
  return status === "meta_sent" || status === "simulated_sent" || status === "sent";
}
