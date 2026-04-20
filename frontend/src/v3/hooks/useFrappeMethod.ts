import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { callMethod, getMethod } from "../api/client";
import type { MethodResponse } from "../api/types";

export function useFrappeMethodQuery<T>(
  method: string,
  args?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<MethodResponse<T>, Error, T>, "queryKey" | "queryFn" | "select">,
) {
  return useQuery({
    queryKey: ["method", method, args],
    queryFn: () => getMethod<T>(method, args as Record<string, string | number | boolean>),
    select: (res) => res.message,
    ...options,
  });
}

export function useFrappeMethodMutation<TArgs extends Record<string, unknown>, TResult>(
  method: string,
  options?: UseMutationOptions<TResult, Error, TArgs>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => {
      const res = await callMethod<TResult>(method, args);
      return res.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    ...options,
  });
}
