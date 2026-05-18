import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { salesApi } from "@/services/api";
import type { SaleCreatePayload } from "@/types";

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaleCreatePayload) => salesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Venta registrada correctamente");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al registrar venta"),
  });
}
