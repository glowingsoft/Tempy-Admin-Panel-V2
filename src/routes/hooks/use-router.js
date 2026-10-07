import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ----------------------------------------------------------------------

export function useRouter() {
  const navigate = useNavigate();

  const router = useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: (href, options) => navigate(href, options),
      replace: (href, options) => navigate(href, { replace: true, ...options }),
    }),
    [navigate]
  );

  return router;
}
