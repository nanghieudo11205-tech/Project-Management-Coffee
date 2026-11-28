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
  category: Category;
}

interface ProductPageResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface UseProductsOptions {
  page: number;
  size: number;
  search: string;
  categoryId: number | "";
}

const fetcher = <T>(url: string) => apiClient.get<T>(url);

export function useProductsData({ page, size, search, categoryId }: UseProductsOptions) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (categoryId !== "") {
    params.set("categoryId", String(categoryId));
  }

  const productsKey = `/products?${params.toString()}`;

  const {
    data: productsData,
    isLoading: productsLoading,
    isValidating: productsValidating,
    mutate: mutateProducts,
  } = useSWR<ProductPageResponse>(productsKey, fetcher);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isValidating: categoriesValidating,
    mutate: mutateCategories,
  } = useSWR<Category[]>("/categories", fetcher);

  return {
    products: productsData?.content || [],
    totalElements: productsData?.totalElements ?? 0,
    totalPages: productsData?.totalPages ?? 1,
    currentPage: productsData?.number ?? page,
    categories: categoriesData || [],
    isLoading: productsLoading || categoriesLoading,
    isValidating: productsValidating || categoriesValidating,
    mutateProducts,
    mutate: async () => {
      await Promise.all([mutateProducts(), mutateCategories()]);
    },
  };
}
