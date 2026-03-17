import { useQuery, useMutation } from '@tanstack/react-query';
import { login, register, getMe } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export function useLogin() {
  const authLogin = useAuthStore((s) => s.login);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (res) => {
      authLogin(res.data.user, res.data.token);
      setAuthModalOpen(false);
    },
  });
}

export function useRegister() {
  const authLogin = useAuthStore((s) => s.login);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);
  return useMutation({
    mutationFn: ({
      displayName,
      email,
      password,
    }: {
      displayName: string;
      email: string;
      password: string;
    }) => register(displayName, email, password),
    onSuccess: (res) => {
      authLogin(res.data.user, res.data.token);
      setAuthModalOpen(false);
    },
  });
}

export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}
