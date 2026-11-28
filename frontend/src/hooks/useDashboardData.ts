"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

export type RevenuePeriodType = "day" | "week" | "month";

export interface DashboardOrder {
  id: number;
  status: string;
  orderType?: string;
  paymentMethod?: string;
  totalAmount: number;
  createdAt: string;
  cafeTable?: { id: number; name: string } | null;
  account?: { username: string } | null;
}

export interface DashboardTable {
  id: number;
  name: string;
  status: string;
}

export interface TopProductItem {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface RevenueItem {
  period: string;
  totalOrders: number;
  totalRevenue: number;
}

interface DashboardStats {
  revenue: number;
  orders: number;
  products: number;
  occupiedTables: number;
  totalTables: number;
}

const fetcher = <T>(url: string) => apiClient.get<T>(url);

export function useDashboardData(periodType: RevenuePeriodType = "day") {
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isValidating: ordersValidating,
  } = useSWR<DashboardOrder[]>("/orders", fetcher);

  const {
    data: productsData,
    isLoading: productsLoading,
    isValidating: productsValidating,
  } = useSWR<{ content: { id: number }[]; totalElements?: number }>("/products?size=1000", fetcher);

  const {
    data: tablesData,
    isLoading: tablesLoading,
    isValidating: tablesValidating,
  } = useSWR<DashboardTable[]>("/tables", fetcher);

  const {
    data: topProductsData,
    isLoading: topProductsLoading,
    isValidating: topProductsValidating,
  } = useSWR<TopProductItem[]>("/orders/top-products", fetcher);

  const { data: chartRevenueData, isLoading: chartLoading } = useSWR<RevenueItem[]>(
    `/revenue/stats?type=${periodType}`,
    fetcher,
  );

  const stats: DashboardStats = (() => {
    const ordersList = ordersData || [];
    const paidOrders = ordersList.filter((o) => o.status === "PAID");
    const totalRev = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const tablesList = tablesData || [];
    const occupiedTables = tablesList.filter((t) => t.status === "OCCUPIED").length;

    return {
      revenue: totalRev,
      orders: ordersList.length,
      products: productsData?.totalElements ?? productsData?.content?.length ?? 0,
      occupiedTables,
      totalTables: tablesList.length,
    };
  })();

  const recentOrders = [...(ordersData || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    stats,
    chartRevenueData: chartRevenueData || [],
    topProducts: (topProductsData || []).slice(0, 5),
    recentOrders,
    isLoading:
      ordersLoading || productsLoading || tablesLoading || topProductsLoading || chartLoading,
    isValidating:
      ordersValidating || productsValidating || tablesValidating || topProductsValidating,
  };
}
