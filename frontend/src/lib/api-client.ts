import Cookies from "js-cookie";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

let redirectCallback: ((path: string) => void) | null = null;

export function setApiRedirectCallback(cb: (path: string) => void) {
  redirectCallback = cb;
}

function resolveEndpointUrl(endpoint: string): string {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (normalized.startsWith("/auth/")) {
    return `/api${normalized}`;
  }
  return `/api/proxy${normalized}`;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers = {}, ...restOptions } = options;

  let url = resolveEndpointUrl(endpoint);

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      delete requestHeaders["Content-Type"];
      requestBody = body;
    } else if (typeof body === "string") {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    credentials: "include",
    headers: requestHeaders,
    body: requestBody,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text().catch(() => null);
    }

    if (response.status === 401) {
      const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
      if (!isLoginPage) {
        Cookies.remove("token");
        Cookies.remove("role");
        Cookies.remove("username");
        if (redirectCallback) {
          redirectCallback("/login");
        } else if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    const validationErrors = (errorData as { validationErrors?: Record<string, string> })
      ?.validationErrors;
    const firstValidationMsg = validationErrors
      ? Object.values(validationErrors).join("; ")
      : undefined;
    const message =
      firstValidationMsg ||
      (errorData as { message?: string })?.message ||
      (errorData as { error?: string })?.error ||
      `Yêu cầu thất bại với mã ${response.status}: ${response.statusText}`;

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

/**
 * Type-Safe Native Fetch API Client
 * Giao tiếp qua Next.js BFF (/api/auth/* & /api/proxy/*) với HttpOnly Cookie JWT
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
