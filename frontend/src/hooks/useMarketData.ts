import { useQuery } from '@tanstack/react-query';
import { fetchMarketTickers, fetchOrderBook } from '../api/services';

export const useMarketTickers = () => {
  return useQuery({
    queryKey: ['market-tickers'],
    queryFn: fetchMarketTickers,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 4000,
  });
};

export const useOrderBook = (symbol: string) => {
  return useQuery({
    queryKey: ['orderbook', symbol],
    queryFn: () => fetchOrderBook(symbol),
    refetchInterval: 3000, // Refetch every 3 seconds
    enabled: Boolean(symbol),
  });
};
