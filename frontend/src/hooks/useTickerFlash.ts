/**
 * useTickerFlash — tracks prev→current price and returns a CSS flash class.
 * Used to animate green/red highlight on rapid WebSocket ticks.
 */
import { useState, useEffect, useRef } from 'react';

export type FlashDirection = 'up' | 'down' | 'neutral';

export function useTickerFlash(price: number | null | undefined): FlashDirection {
  const prevRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<FlashDirection>('neutral');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (price === null || price === undefined) return;
    const prev = prevRef.current;
    if (prev !== null && price !== prev) {
      const dir: FlashDirection = price > prev ? 'up' : 'down';
      setDirection(dir);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDirection('neutral'), 600);
    }
    prevRef.current = price;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [price]);

  return direction;
}

/** Returns the appropriate CSS class for a flash direction */
export function flashClass(direction: FlashDirection): string {
  if (direction === 'up') return 'text-emerald-400 transition-colors duration-150';
  if (direction === 'down') return 'text-rose-400 transition-colors duration-150';
  return '';
}
