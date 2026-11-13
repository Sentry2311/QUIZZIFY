import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api.js';

/**
 * Fetch a REST endpoint and track loading/error state.
 * @param {string|null} url - endpoint path, or null to skip.
 * @param {{params?: object, deps?: unknown[], skip?: boolean}} options
 */
export function useApi(url, { params, deps = [], skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip && Boolean(url));
  const [error, setError] = useState(null);
  const paramsKey = params ? JSON.stringify(params) : '';
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const run = useCallback(async () => {
    if (!url) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url, { params: paramsRef.current });
      setData(response.data.data ?? response.data);
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skip || !url) {
      setLoading(false);
      return;
    }
    run();
  }, [run, skip, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: run, setData };
}
