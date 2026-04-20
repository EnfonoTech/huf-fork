import {
  FrappeApiError,
  type FrappeError,
  type ListResponse,
  type MethodResponse,
  type SingleResponse,
} from "./types";

/**
 * Single fetch wrapper for every v3 REST call. Sends the Frappe session cookie
 * via credentials: "include". Throws FrappeApiError on !response.ok so React
 * Query's error boundary receives a structured object.
 */

type QueryValue = string | number | boolean | null | undefined;
type QueryObject = Record<string, QueryValue | QueryValue[]>;

function encodeQuery(params: QueryObject | undefined): string {
  if (!params) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const values = Array.isArray(v) ? v : [v];
    for (const value of values) {
      if (value === undefined || value === null) continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

async function request<T>(
  path: string,
  init: RequestInit & { query?: QueryObject } = {},
): Promise<T> {
  const { query, ...rest } = init;
  const url = `${path}${encodeQuery(query)}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Frappe-CSRF-Token": (window as unknown as { csrf_token?: string }).csrf_token ?? "",
      ...(rest.headers ?? {}),
    },
    ...rest,
  });
  if (!res.ok) {
    let data: FrappeError | null = null;
    try {
      data = (await res.json()) as FrappeError;
    } catch {
      /* response body was not JSON */
    }
    throw new FrappeApiError(res.status, data, data?._error_message ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** GET /api/resource/:doctype?filters=…&fields=…&limit=… */
export function listDocs<T>(
  doctype: string,
  query: {
    filters?: [string, string, unknown][];
    fields?: string[];
    limit?: number;
    order_by?: string;
  } = {},
): Promise<ListResponse<T>> {
  const params: QueryObject = { limit: query.limit ?? 50 };
  if (query.fields) params.fields = JSON.stringify(query.fields);
  if (query.filters) params.filters = JSON.stringify(query.filters);
  if (query.order_by) params.order_by = query.order_by;
  return request<ListResponse<T>>(`/api/resource/${encodeURIComponent(doctype)}`, {
    query: params,
  });
}

/** GET /api/resource/:doctype/:name */
export function getDoc<T>(doctype: string, name: string): Promise<SingleResponse<T>> {
  return request<SingleResponse<T>>(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
  );
}

/** POST /api/method/:method (whitelisted Python function) */
export function callMethod<T>(method: string, args?: Record<string, unknown>): Promise<MethodResponse<T>> {
  return request<MethodResponse<T>>(`/api/method/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args ?? {}),
  });
}

/** GET /api/method/:method (whitelisted, read-only) */
export function getMethod<T>(method: string, query?: QueryObject): Promise<MethodResponse<T>> {
  return request<MethodResponse<T>>(`/api/method/${method}`, { query });
}
