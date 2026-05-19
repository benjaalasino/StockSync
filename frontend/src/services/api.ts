/**
 * Cliente HTTP centralizado con Axios.
 * Inyecta el token JWT en cada request autenticado.
 */

import axios from "axios";
import type {
  Product,
  ProductVariant,
  Category,
  AttributeType,
  TokenResponse,
  User,
  StockSummary,
  StockMovement,
  Sale,
  PurchaseOrder,
  Supplier,
} from "@/types";

const BASE_URL = "/api/v1";

export const apiClient = axios.create({ baseURL: BASE_URL });

// Inyectar token JWT en cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir al login si el token expiró o no hay sesión
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("stocksync-auth");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    const { data } = await apiClient.post<TokenResponse>("/auth/login", form);
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};

// ─── Products ────────────────────────────────────────────────────────────────

export const productsApi = {
  list: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>("/products/");
    return data;
  },
  get: async (id: number): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },
  create: async (payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.post<Product>("/products/", payload);
    return data;
  },
  update: async (id: number, payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(`/products/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
  generateVariants: async (
    productId: number,
    payload: {
      attribute_combinations: number[][];
      base_sale_price: number;
      base_cost_price?: number;
      reorder_point?: number;
    }
  ): Promise<ProductVariant[]> => {
    const { data } = await apiClient.post<ProductVariant[]>(
      `/products/${productId}/variants/generate`,
      payload
    );
    return data;
  },
};

// ─── Categories & Attributes ─────────────────────────────────────────────────

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>("/products/categories");
    return data;
  },
  create: async (name: string, description?: string): Promise<Category> => {
    const { data } = await apiClient.post<Category>("/products/categories", {
      name,
      description,
    });
    return data;
  },
};

export const attributesApi = {
  list: async (): Promise<AttributeType[]> => {
    const { data } = await apiClient.get<AttributeType[]>("/products/attributes");
    return data;
  },
};

// ─── Stock ───────────────────────────────────────────────────────────────────

export const stockApi = {
  summary: async (variantId: number): Promise<StockSummary> => {
    const { data } = await apiClient.get<StockSummary>(
      `/stock/summary/${variantId}`
    );
    return data;
  },
  movements: async (variantId: number): Promise<StockMovement[]> => {
    const { data } = await apiClient.get<StockMovement[]>(
      `/stock/movements/${variantId}`
    );
    return data;
  },
  lowStockAlerts: async (): Promise<StockSummary[]> => {
    const { data } = await apiClient.get<StockSummary[]>(
      "/stock/alerts/low-stock"
    );
    return data;
  },
  adjust: async (payload: {
    variant_id: number;
    quantity: number;
    notes: string;
  }): Promise<StockMovement> => {
    const { data } = await apiClient.post<StockMovement>(
      "/stock/adjust",
      payload
    );
    return data;
  },
};

// ─── Sales ───────────────────────────────────────────────────────────────────

export const salesApi = {
  create: async (payload: {
    items: { variant_id: number; quantity: number }[];
    notes?: string;
  }): Promise<Sale> => {
    const { data } = await apiClient.post<Sale>("/stock/sales", payload);
    return data;
  },
};

// ─── Purchases ───────────────────────────────────────────────────────────────

export const purchasesApi = {
  create: async (payload: {
    supplier_id: number;
    items: { variant_id: number; quantity: number; unit_cost: number }[];
    notes?: string;
  }): Promise<PurchaseOrder> => {
    const { data } = await apiClient.post<PurchaseOrder>(
      "/stock/purchases",
      payload
    );
    return data;
  },
  receive: async (orderId: number): Promise<PurchaseOrder> => {
    const { data } = await apiClient.post<PurchaseOrder>(
      `/stock/purchases/${orderId}/receive`
    );
    return data;
  },
};

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const suppliersApi = {
  list: async (): Promise<Supplier[]> => {
    const { data } = await apiClient.get<Supplier[]>("/stock/suppliers");
    return data;
  },
  create: async (payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await apiClient.post<Supplier>("/stock/suppliers", payload);
    return data;
  },
};
