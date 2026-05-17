export interface Category {
  id: string;
  name: string;
  description?: string;
  shopId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  
  categoryId: string;
  category?: Category;
  shopId: string;
  
  buyingPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  
  stockQuantity: number;
  minStockAlert: number;
  
  // Unités courantes en quincaillerie (Sac, Barre, Paquet, etc.)
  unit: string;
  
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashSession {
  id: string;
  shopId: string;
  userId: string;
  openingBalance: number;
  closingBalance?: number;
  status: "OPEN" | "CLOSED";
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface SaleItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice?: number;
}

export interface SalePayment {
  id?: string;
  method: "CASH" | "MOBILE_MONEY" | "BANK_CARD" | "CREDIT";
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  shopId: string;
  userId: string;
  cashSessionId?: string;
  customerId?: string;
  
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  
  status: "COMPLETED" | "PARTIALLY_PAID" | "VOIDED" | "REFUNDED" | "DRAFT";
  
  items: SaleItem[];
  payments: SalePayment[];
  
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  shopId: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  shopId: string;
  userId: string;
  title: string;
  amount: number;
  category: "RENT" | "UTILITIES" | "SALARY" | "SUPPLIES" | "TRANSPORT" | "MAINTENANCE" | "TAXES" | "MARKETING" | "OTHER";
  paymentMethod: "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CHECK";
  reference?: string;
  notes?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}
