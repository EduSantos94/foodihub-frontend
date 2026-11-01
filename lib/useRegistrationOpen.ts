import { useEffect, useState } from 'react';
import { api } from './api';

/** Whether new stores can sign up (the server can close it). null while it is being checked. */
export function useRegistrationOpen(): boolean | null {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/config')
      .then((res) => !cancelled && setOpen(res.data?.data?.registration_open !== false))
      .catch(() => !cancelled && setOpen(false)); // can't reach the server: the sign-up would fail as well
    return () => {
      cancelled = true;
    };
  }, []);
  return open;
}
