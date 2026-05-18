import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { suppliersApi } from "@/services/api";
import type { SupplierCreatePayload } from "@/types";

export const SUPPLIERS_KEY = ["suppliers"] as const;

export function useSuppliers() {
  return useQuery({ queryKey: SUPPLIERS_KEY, queryFn: suppliersApi.list });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupplierCreatePayload) => suppliersApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      toast.success("Proveedor creado");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al crear proveedor"),
  });
}
