export interface Material {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
}

export interface Supplier {
  id: number;
  name: string;
  category: string;
  contact: string;
  phone: string;
  debt: number;
  lastDelivery: string;
}

export interface Credit {
  id: number;
  customer: string;
  phone: string;
  totalDebt: number;
  lastPayment: string;
  status: "Sain" | "Risqué" | "Contentieux";
}

export interface Expense {
  id: number;
  label: string;
  category: "Logistique" | "Loyer" | "Utilités" | "Divers";
  amount: number;
  date: string;
  status: "Payé" | "En attente";
}

export interface Delivery {
  id: number;
  orderId: string;
  customer: string;
  destination: string;
  driver: string;
  vehicle: "Tricycle" | "Camion 5T" | "Camion 10T";
  status: "En attente" | "En cours" | "Livré" | "Annulé";
}
