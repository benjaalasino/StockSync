import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { stockApi } from "@/services/api";
import type { StockAdjustPayload } from "@/types";

export const LOW_STOCK_KEY = ["low-stock-alerts"] as const;
export const STOCK_SUMMARY_KEY = (variantId: number) => ["stock-summary", variantId] as const;
export const MOVEMENTS_KEY = (variantId: number) => ["movements", variantId] as const;

export function useLowStockAlerts() {
  return useQuery({ queryKey: LOW_STOCK_KEY, queryFn: stockApi.lowStockAlerts });
}

export function useStockSummary(variantId: number) {
  return useQuery({
    queryKey: STOCK_SUMMARY_KEY(variantId),
    queryFn: () => stockApi.summary(variantId),
    enabled: variantId > 0,
  });
}

export function useMovements(variantId: number) {
  return useQuery({
    queryKey: MOVEMENTS_KEY(variantId),
    queryFn: () => stockApi.movements(variantId),
    enabled: variantId > 0,
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAdjustPayload) => stockApi.adjust(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: STOCK_SUMMARY_KEY(vars.variant_id) });
      qc.invalidateQueries({ queryKey: LOW_STOCK_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock ajustado");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Error al ajustar stock"),
  });
}
