import { useQuery } from '@tanstack/react-query';
import { fetchHealth, fetchStatus } from '../api/services';

export const useHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: fetchHealth,
    refetchInterval: 5000,
    staleTime: 4000,
  });
};

export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: fetchStatus,
    refetchInterval: 5000,
    staleTime: 4000,
  });
};
