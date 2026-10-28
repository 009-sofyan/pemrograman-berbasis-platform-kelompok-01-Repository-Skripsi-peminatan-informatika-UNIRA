import { useEffect, useRef, useState, type DependencyList } from "react";
import { getApiErrorMessage } from "../lib/errors";

interface QueryOptions {
  enabled?: boolean;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  rawError: unknown;
}

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
  options: QueryOptions = {},
) {
  const { enabled = true } = options;
  const fetcherRef = useRef(fetcher);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
    rawError: null,
  });

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null, rawError: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!active) return;
        setState({ data, loading: false, error: null, rawError: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: getApiErrorMessage(error),
          rawError: error,
        }));
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce]);

  const refetch = () => setNonce((value) => value + 1);

  const setData = (updater: T | null | ((current: T | null) => T | null)) => {
    setState((prev) => ({
      ...prev,
      data:
        typeof updater === "function"
          ? (updater as (current: T | null) => T | null)(prev.data)
          : updater,
    }));
  };

  return { ...state, refetch, setData };
}
