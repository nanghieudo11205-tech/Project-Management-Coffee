"use client";

import useSWR from "swr";
import { axiosFetcher } from "@/lib/swr";

export interface AccountItem {
  id: number;
  username: string;
  role: string;
}

export interface EmployeeItem {
  id: number;
  fullName: string;
  phoneNumber?: string;
  identityCard?: string;
  dateOfBirth?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  account?: AccountItem | null;
  isActive: boolean;
}

export function useEmployeesData() {
  const {
    data: employeesData,
    isLoading: employeesLoading,
    isValidating: employeesValidating,
    mutate: mutateEmployees,
  } = useSWR<EmployeeItem[]>("/employees", axiosFetcher);

  const {
    data: accountsData,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR<AccountItem[]>("/accounts", axiosFetcher);

  return {
    employees: employeesData || [],
    accounts: accountsData || [],
    isLoading: employeesLoading || accountsLoading,
    isValidating: employeesValidating,
    mutate: async () => {
      await Promise.all([mutateEmployees(), mutateAccounts()]);
    },
  };
}
