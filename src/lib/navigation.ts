import {
  CalendarDays,
  ClipboardList,
  FileDown,
  MessageCircle,
  Send,
  Users,
  Beef,
  Settings,
  ListChecks,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Início", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/tabela-dia", label: "Tabela do dia", icon: Beef },
  { href: "/promocoes", label: "Promoções", icon: Send },
  { href: "/mensagens", label: "Mensagens enviadas", icon: ListChecks },
  { href: "/respostas", label: "Respostas", icon: MessageCircle },
  { href: "/pedidos", label: "Pedidos", icon: FileDown },
  { href: "/configuracoes/whatsapp", label: "WhatsApp Meta", icon: Settings },
];
