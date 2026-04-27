import type { Campaign, Client, OrderItem, ResponseItem } from "@/lib/types";

export const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export const typeOptions = ["Todos", "Açougue", "Restaurante", "Mercado", "Hotel"];

export const initialClients: Client[] = [
  {
    id: 1,
    name: "Açougue Bom Fim",
    contact: "Carlos",
    phone: "(22) 99991-1111",
    type: "Açougue",
    neighborhood: "Centro",
    days: ["Segunda", "Quarta", "Sexta"],
    receivesTable: true,
    receivesPromo: true,
    status: "Ativo",
  },
  {
    id: 2,
    name: "Restaurante Mar Azul",
    contact: "Joana",
    phone: "(22) 99992-2222",
    type: "Restaurante",
    neighborhood: "Passagem",
    days: ["Segunda", "Terça", "Quinta"],
    receivesTable: true,
    receivesPromo: true,
    status: "Ativo",
  },
  {
    id: 3,
    name: "Churrascaria Central",
    contact: "Roberto",
    phone: "(22) 99993-3333",
    type: "Restaurante",
    neighborhood: "Braga",
    days: ["Segunda", "Sexta"],
    receivesTable: true,
    receivesPromo: true,
    status: "Ativo",
  },
  {
    id: 4,
    name: "Mercado Costa Verde",
    contact: "Fernanda",
    phone: "(22) 99994-4444",
    type: "Mercado",
    neighborhood: "São Cristóvão",
    days: ["Terça", "Quinta"],
    receivesTable: true,
    receivesPromo: false,
    status: "Ativo",
  },
  {
    id: 5,
    name: "Hotel Atlântico",
    contact: "Sérgio",
    phone: "(22) 99995-5555",
    type: "Hotel",
    neighborhood: "Praia do Forte",
    days: ["Quarta", "Sexta"],
    receivesTable: true,
    receivesPromo: true,
    status: "Ativo",
  },
];

export const defaultRawTable =
  "Picanha 89,90\nAlcatra 42,50\nContra filé 45,00\nAcém 29,90\nFraldinha 48,90\nLinguiça 19,90";

export const initialCampaigns: Campaign[] = [];
export const initialResponses: ResponseItem[] = [];
export const initialOrders: OrderItem[] = [];
