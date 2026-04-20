import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listDocs } from "../api/client";
import type { FrappeDoc, ListResponse } from "../api/types";

export function useFrappeList<T>(
  doctype: string,
  query: {
    filters?: [string, string, unknown][];
    fields?: string[];
    limit?: number;
    order_by?: string;
  } = {},
  options?: Omit<UseQueryOptions<ListResponse<T>, Error, FrappeDoc<T>[]>, "queryKey" | "queryFn" | "select">,
) {
  return useQuery({
    queryKey: [doctype, "list", query],
    queryFn: () => listDocs<T>(doctype, query),
    select: (res) => res.data,
    ...options,
  });
}
