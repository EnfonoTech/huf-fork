import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getDoc } from "../api/client";
import type { FrappeDoc, SingleResponse } from "../api/types";

export function useFrappeDoc<T>(
  doctype: string,
  name: string | undefined,
  options?: Omit<UseQueryOptions<SingleResponse<T>, Error, FrappeDoc<T>>, "queryKey" | "queryFn" | "select">,
) {
  return useQuery({
    queryKey: [doctype, "doc", name],
    queryFn: () => getDoc<T>(doctype, name!),
    select: (res) => res.data,
    enabled: !!name,
    ...options,
  });
}
