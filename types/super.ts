/**
 * ============================================================================
 * TYPES MODULE SUPERETTE
 * ============================================================================
 * 
 * Ce fichier centralise TOUS les types TypeScript utilisés par le module
 * Superette (app/super). Chaque interface est mappée 1:1 sur les entités
 * et DTOs du backend NestJS (back-spservice).
 * 
 * Convention de nommage :
 * - Les interfaces correspondent aux entités retournées par le backend
 * - Les types "Create*Dto" correspondent aux payloads envoyés au backend
 * - Les enums reprennent exactement les valeurs Prisma du backend
 * 
 * @see back-spservice/src/modules/
 * ============================================================================
 */

// ============================================================================
// ENUMS — Alignés sur Prisma (back-spservice)
// ============================================================================

/**
 * Catégories de dépenses — correspond à ExpenseCategory dans le backend
 * @see back-spservice/src/modules/expense/domain/entities/expense.entity.ts
 */
export enum ExpenseCategory {
  RENT = "RENT",               // Loyer
  UTILITIES = "UTILITIES",     // Eau / Électricité
  SALARY = "SALARY",           // Salaires
  SUPPLIES = "SUPPLIES",       // Fournitures
  TRANSPORT = "TRANSPORT",     // Transport
  MAINTENANCE = "MAINTENANCE", // Entretien
  TAXES = "TAXES",             // Taxes
  MARKETING = "MARKETING",     // Publicité
  OTHER = "OTHER",             // Autres
}

/**
 * Méthodes de paiement — correspond à PaymentMethod dans Prisma
 * Utilisé dans les ventes, les versements clients, etc.
 */
export enum PaymentMethod {
  CASH = "CASH",
  MOBILE_MONEY = "MOBILE_MONEY",
  BANK_CARD = "BANK_CARD",
  CREDIT = "CREDIT",
  MIXED = "MIXED",
}

/**
 * Statuts d'un bon de commande fournisseur
 * @see back-spservice/src/modules/purchase-order
 */
export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",           // Brouillon
  SENT = "SENT",             // Envoyé au fournisseur
  PARTIAL = "PARTIAL",       // Réception partielle
  RECEIVED = "RECEIVED",     // Entièrement reçu
  CANCELLED = "CANCELLED",   // Annulé
}

/**
 * Statuts d'un transfert de stock inter-boutiques
 * @see back-spservice/src/modules/stock-transfer
 */
export enum StockTransferStatus {
  PENDING = "PENDING",       // En attente de validation
  IN_TRANSIT = "IN_TRANSIT", // En cours de transfert
  COMPLETED = "COMPLETED",   // Réception confirmée (stock ajouté)
  CANCELLED = "CANCELLED",   // Annulé (stock réintégré à la source)
}

/**
 * Statuts d'une session de caisse
 * @see back-spservice/src/modules/cash-session
 */
export enum CashSessionStatus {
  OPEN = "OPEN",     // Session active
  CLOSED = "CLOSED", // Session clôturée
}

// ============================================================================
// INTERFACES — Entités retournées par le backend
// ============================================================================

/**
 * Session de caisse — Représente une période d'activité du caissier.
 * Chaque vente doit être rattachée à une session active.
 * 
 * Endpoints :
 *   POST   /cash-sessions/open          → Ouvrir une session
 *   PATCH  /cash-sessions/:id/close     → Fermer la session
 *   GET    /cash-sessions/active/:userId → Session active du caissier
 * 
 * @see back-spservice/src/modules/cash-session
 */
export interface CashSession {
  id: string;
  shopId: string;
  userId: string;
  openingBalance: number;   // Fond de caisse à l'ouverture
  closingBalance?: number;  // Montant compté à la fermeture
  status: CashSessionStatus;
  notes?: string;
  openedAt: string;         // Date ISO d'ouverture
  closedAt?: string;        // Date ISO de fermeture (null si encore active)
  createdAt: string;
  updatedAt: string;
}

/**
 * Dépense — Charge opérationnelle de la boutique.
 * 
 * Endpoints :
 *   POST   /expenses      → Créer
 *   GET    /expenses      → Lister (avec filtres shopId, category, startDate, endDate)
 *   GET    /expenses/:id  → Détail
 *   PUT    /expenses/:id  → Modifier
 *   DELETE /expenses/:id  → Supprimer
 * 
 * @see back-spservice/src/modules/expense
 */
export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;              // Date ISO de la dépense
  description?: string;
  receiptUrl?: string;       // URL du justificatif (photo reçu, etc.)
  isRecurring: boolean;      // Dépense récurrente (loyer, etc.)
  recurringDay?: number;     // Jour du mois pour la récurrence (1-31)
  shopId: string;
  userId?: string;           // Utilisateur ayant créé la dépense
  syncStatus?: string;       // Statut de synchronisation offline
  localId?: string;          // ID local pour le support offline
  createdAt: string;
  updatedAt: string;
}

/**
 * Lot de produit (arrivage) — Permet de tracer les dates de péremption
 * et de gérer la traçabilité FIFO (First In, First Out).
 * 
 * Endpoints :
 *   POST   /product-batches                  → Enregistrer un lot
 *   GET    /product-batches/product/:id      → Lots d'un produit
 *   GET    /product-batches/expiring/:shopId → Lots expirant bientôt
 *   PUT    /product-batches/:id              → Modifier un lot
 * 
 * @see back-spservice/src/modules/product-batch
 */
export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;      // Numéro de lot (ex: LOT-2026-001)
  quantity: number;          // Quantité restante dans le lot
  expiresAt?: string;        // Date d'expiration ISO (nullable si non périssable)
  buyingPrice: number;       // Prix d'achat unitaire
  receivedAt?: string;       // Date de réception du lot
  createdAt: string;
  updatedAt: string;
  // Relations incluses par le backend
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
}

/**
 * Fournisseur — Entité représentant un approvisionneur.
 * 
 * Endpoints :
 *   POST   /suppliers      → Créer
 *   GET    /suppliers      → Lister (avec pagination)
 *   GET    /suppliers/:id  → Détail
 *   PUT    /suppliers/:id  → Modifier
 *   DELETE /suppliers/:id  → Supprimer
 * 
 * @see back-spservice/src/modules/supplier
 */
export interface Supplier {
  id: string;
  name: string;
  contact?: string;         // Personne de contact
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bon de commande fournisseur — Permet de commander du stock
 * auprès d'un fournisseur et de suivre la réception.
 * 
 * Endpoints :
 *   POST   /purchase-orders              → Créer
 *   GET    /purchase-orders              → Lister
 *   GET    /purchase-orders/:id          → Détail
 *   PUT    /purchase-orders/:id/status   → Changer le statut
 *   POST   /purchase-orders/:id/receive  → Réceptionner des articles
 * 
 * @see back-spservice/src/modules/purchase-order
 */
export interface PurchaseOrder {
  id: string;
  supplierId: string;
  shopId: string;
  status: PurchaseOrderStatus;
  expectedAt?: string;      // Date de livraison prévue
  notes?: string;
  totalAmount?: number;     // Montant total calculé
  createdAt: string;
  updatedAt: string;
  // Relations
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

/**
 * Article d'un bon de commande
 */
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  product?: {
    id: string;
    name: string;
  };
}

/**
 * Transfert de stock — Déplacement de produits entre boutiques.
 * 
 * Endpoints :
 *   POST   /stock-transfers            → Créer un transfert
 *   GET    /stock-transfers            → Lister (filtres: fromShopId, toShopId, status)
 *   GET    /stock-transfers/:id        → Détail
 *   PUT    /stock-transfers/:id/status → Mettre à jour le statut
 * 
 * @see back-spservice/src/modules/stock-transfer
 */
export interface StockTransfer {
  id: string;
  fromShopId: string;
  toShopId: string;
  userId: string;
  status: StockTransferStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  items?: StockTransferItem[];
  fromShop?: { id: string; name: string };
  toShop?: { id: string; name: string };
}

/**
 * Article dans un transfert de stock
 */
export interface StockTransferItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  product?: {
    id: string;
    name: string;
  };
}

/**
 * Paiement de crédit — Versement effectué par un client pour
 * rembourser une dette. Réduit automatiquement le champ totalDebt du client.
 * 
 * Endpoints :
 *   POST   /credit-payments                      → Enregistrer un versement
 *   GET    /credit-payments/paginate             → Paginer
 *   GET    /credit-payments/customer/:customerId → Historique d'un client
 *   GET    /credit-payments/:id                  → Détail
 * 
 * @see back-spservice/src/modules/credit-payment
 */
export interface CreditPayment {
  id: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;       // Référence de transaction (ex: OM_123456)
  notes?: string;
  localId?: string;         // Support offline
  createdAt: string;
  updatedAt: string;
  // Relation
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
}

// ============================================================================
// DTOs — Payloads envoyés au backend pour les créations/modifications
// ============================================================================

/** DTO pour ouvrir une session de caisse */
export interface OpenCashSessionDto {
  shopId: string;
  userId: string;
  openingBalance: number;
  notes?: string;
}

/** DTO pour fermer une session de caisse */
export interface CloseCashSessionDto {
  closingBalance: number;
  notes?: string;
}

/** DTO pour créer une dépense */
export interface CreateExpenseDto {
  title: string;
  category: ExpenseCategory;
  amount: number;
  shopId: string;
  userId: string;            // OBLIGATOIRE — Le backend l'exige
  date?: string;
  description?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringDay?: number;
}

/** DTO pour filtrer les dépenses */
export interface FilterExpenseDto {
  shopId?: string;
  category?: ExpenseCategory;
  startDate?: string;         // Format YYYY-MM-DD
  endDate?: string;           // Format YYYY-MM-DD
}

/** DTO pour créer un lot de produit (arrivage) */
export interface CreateProductBatchDto {
  productId: string;
  batchNumber: string;
  quantity: number;
  buyingPrice: number;
  expiresAt?: string;
  receivedAt?: string;
}

/** DTO pour créer un fournisseur */
export interface CreateSupplierDto {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

/** DTO pour créer un bon de commande */
export interface CreatePurchaseOrderDto {
  supplierId: string;
  shopId: string;
  expectedAt?: string;
  notes?: string;
  items: {
    productId: string;
    quantityOrdered: number;
    unitCost: number;
  }[];
}

/** DTO pour réceptionner des articles d'une commande */
export interface ReceiveItemsDto {
  userId: string;
  items: {
    itemId: string;           // ID de l'item dans la commande
    quantityReceived: number;
  }[];
}

/** DTO pour créer un transfert de stock */
export interface CreateStockTransferDto {
  fromShopId: string;
  toShopId: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
  notes?: string;
}

/** DTO pour créer un versement client */
export interface CreateCreditPaymentDto {
  customerId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  localId?: string;
}
