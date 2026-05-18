import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { productsApi, categoriesApi } from "@/services/api";
import type { ProductCreatePayload, ProductUpdatePayload } from "@/types";

export const PRODUCTS_KEY = ["products"] as const;
export const CATEGORIES_KEY = ["categories"] as const;

export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_KEY, queryFn: productsApi.list });
}

export function useProduct(id: number) {
  return useQuery({ queryKey: [...PRODUCTS_KEY, id], queryFn: () => productsApi.get(id) });
}

export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: categoriesApi.list });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductCreatePayload) => productsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      toast.success("Producto creado");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al crear producto"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductUpdatePayload }) =>
      productsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      toast.success("Producto actualizado");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al actualizar"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      toast.success("Producto eliminado");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al eliminar"),
  });
}
