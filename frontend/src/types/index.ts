// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "operator";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface AttributeType {
  id: number;
  name: string;
}

export interface AttributeValue {
  id: number;
  attribute_type_id: number;
  value: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  sale_price: string;
  cost_price: string | null;
  reorder_point: number;
  is_active: boolean;
  current_stock: number;
  attribute_values: AttributeValue[];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  brand: string | null;
  base_sku: string;
  category_id: number | null;
  is_active: boolean;
  created_at: string;
  variants: ProductVariant[];
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "RETURN_IN"
  | "RETURN_OUT";

export interface StockMovement {
  id: number;
  variant_id: number;
  user_id: number;
  movement_type: MovementType;
  quantity: number;
  unit_cost: string | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface StockSummary {
  variant_id: number;
  variant_sku: string;
  current_stock: number;
  reorder_point: number;
  below_reorder: boolean;
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export interface SaleItem {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price: string;
}

export interface Sale {
  id: number;
  created_by: number;
  notes: string | null;
  is_cancelled: boolean;
  created_at: string;
  items: SaleItem[];
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export type PurchaseOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: number;
  variant_id: number;
  quantity: number;
  unit_cost: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  created_by: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  received_at: string | null;
  created_at: string;
  items: PurchaseOrderItem[];
}

// ─── Supplier ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}
