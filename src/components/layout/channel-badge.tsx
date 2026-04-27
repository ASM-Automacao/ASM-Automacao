"use client";

import { useEffect, useState } from "react";

type Status = {
  whatsappMode: string;
  hasAccessToken: boolean;
  hasPhoneNumberId: boolean;
  hasVerifyToken: boolean;
};

export function ChannelBadge() {
  const [s, setS] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/whatsapp/config-status")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setS(null));
  }, []);

  if (!s) {
    return <p className="mt-2 text-xs text-slate-300">Carregando status do canal…</p>;
  }

  const ready = s.whatsappMode === "meta" && s.hasAccessToken && s.hasPhoneNumberId && s.hasVerifyToken;

  return (
    <p className="mt-2 text-xs text-slate-300">
      Modo: <span className="font-semibold text-white">{s.whatsappMode}</span>
      {ready ? " · pronto para Meta" : " · verifique token, Phone Number ID e verify token nas configurações"}
    </p>
  );
}
