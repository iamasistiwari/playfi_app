import { AxiosError } from "axios";
import { useEffect, useState } from "react";

export default function useFetch<T>(
  fetchFunction: () => Promise<T>,
  autoFetch = false
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<String | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (e) {
      if (e instanceof AxiosError) {
        setError(JSON.stringify(e.response?.data || "Something went wrong"));
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };
  const resetData = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, []);

  return {
    data,
    error,
    loading,
    refetch: fetchData,
    resetData,
  };
}
