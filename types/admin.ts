export interface Shop {
  id: number;
  name: string;
  type: "superette" | "quincaillerie";
  location: string;
  manager: string;
  status: "actif" | "inactif";
}

export interface UserAccount {
  id: number;
  name: string;
  username: string;
  role: "admin" | "caissiere" | "gerant";
  shop: string;
  status: "actif" | "inactif";
}
