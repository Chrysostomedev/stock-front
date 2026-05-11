export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
  customPrice?: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: "cash" | "mtn" | "moov" | "credit";
  customerName?: string;
  date: string;
  time: string;
}
