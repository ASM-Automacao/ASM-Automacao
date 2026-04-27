export type Client = {
  id: number;
  name: string;
  contact: string;
  phone: string;
  type: string;
  neighborhood: string;
  days: string[];
  receivesTable: boolean;
  receivesPromo: boolean;
  status: "Ativo" | "Inativo";
};

export type Campaign = {
  id: number;
  kind: "Tabela" | "Promocao";
  title: string;
  recipients: number;
  createdAt: string;
  status: string;
};

export type ResponseItem = {
  id: number;
  clientName: string;
  message: string;
  status: string;
  source: string;
  time: string;
};

export type OrderItem = {
  id: number;
  date: string;
  clientName: string;
  product: string;
  quantity: string;
  unit: string;
  status: string;
  note: string;
};
