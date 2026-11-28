"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

export interface Table {
  id: number;
  name: string;
  status: string;
}

export interface OrderDetailSummary {
  id: number;
  quantity: number;
  price: number;
  note?: string | null;
  product?: { id: number; name: string } | null;
}

export interface Order {
  id: number;
  status: string;
  orderType?: string;
  totalAmount: number;
  createdAt?: string;
  cafeTable?: Table | null;
  orderDetails?: OrderDetailSummary[];
}

const fetcher = <T>(url: string) => apiClient.get<T>(url);

export function useTablesData() {
  const {
    data: tablesData,
    isLoading: tablesLoading,
    isValidating: tablesValidating,
    mutate: mutateTables,
  } = useSWR<Table[]>("/tables", fetcher);

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isValidating: ordersValidating,
    mutate: mutateOrders,
  } = useSWR<Order[]>("/orders", fetcher);

  const pendingOrders = (ordersData || []).filter((o) => o.status === "PENDING");

  return {
    tables: tablesData || [],
    orders: pendingOrders,
    isLoading: tablesLoading || ordersLoading,
    isValidating: tablesValidating || ordersValidating,
    mutateTables,
    mutate: async () => {
      await Promise.all([mutateTables(), mutateOrders()]);
    },
  };
}
