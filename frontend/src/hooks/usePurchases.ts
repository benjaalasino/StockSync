import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { purchasesApi } from "@/services/api";
import type { PurchaseOrderCreatePayload } from "@/types";

export function useCreatePurchaseOrder() {
  return useMutation({
    mutationFn: (payload: PurchaseOrderCreatePayload) => purchasesApi.create(payload),
    onSuccess: () => {
      toast.success("Orden de compra creada");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al crear orden"),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => purchasesApi.receive(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Mercadería recibida — stock actualizado");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al recibir orden"),
  });
}
