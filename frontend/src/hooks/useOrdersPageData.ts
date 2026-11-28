"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  category?: Category;
}

export interface Table {
  id: number;
  name: string;
  status: string;
}

const fetcher = <T>(url: string) => apiClient.get<T>(url);

export function useOrdersPageData() {
  const {
    data: productsData,
    isLoading: productsLoading,
    isValidating: productsValidating,
  } = useSWR<{ content: Product[] }>("/products?size=1000", fetcher);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isValidating: categoriesValidating,
  } = useSWR<Category[]>("/categories", fetcher);

  const {
    data: tablesData,
    isLoading: tablesLoading,
    isValidating: tablesValidating,
    mutate: mutateTables,
  } = useSWR<Table[]>("/tables", fetcher);

  const availableTables = (tablesData || []).filter((t) => t.status === "AVAILABLE");

  return {
    products: productsData?.content || [],
    categories: categoriesData || [],
    tables: availableTables,
    isLoading: productsLoading || categoriesLoading || tablesLoading,
    isValidating: productsValidating || categoriesValidating || tablesValidating,
    mutateTables,
  };
}
