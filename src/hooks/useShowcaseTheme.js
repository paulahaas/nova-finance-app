import { useEffect } from 'react';

/** Tints the whole page (top bar included) with the color of a card type while the page is open. */
export function useShowcaseTheme(type) {
  useEffect(() => {
    document.documentElement.dataset.sc = type;
    return () => {
      delete document.documentElement.dataset.sc;
    };
  }, [type]);
}
