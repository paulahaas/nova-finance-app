import { useEffect, useState } from 'react';
import { fetchRate } from '../services/exchangeRateService';

/** Units of `to` per 1 unit of `from`, fetched live from frankfurter.app. */
export function useExchangeRate(from, to) {
  const [state, setState] = useState({ rate: null, loading: false, error: null });

  useEffect(() => {
    if (!from || !to) {
      setState({ rate: null, loading: false, error: null });
      return undefined;
    }
    if (from === to) {
      setState({ rate: 1, loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRate(from, to)
      .then((rate) => {
        if (!cancelled) setState({ rate, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ rate: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return state;
}
