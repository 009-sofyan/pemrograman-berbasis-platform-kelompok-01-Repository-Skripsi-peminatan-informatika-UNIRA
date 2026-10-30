import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import type {
  LoginPayload,
  RegisterPayload,
  Role,
  User,
} from "../types";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearSession,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "../lib/storage";
import { isForbidden, isUnauthorized } from "../lib/errors";
import {
  applyLocalProfile,
  saveLocalProfile,
  type ProfilePatch,
} from "../lib/profile";
import { ROLE_META } from "../constants";
import { useToast } from "./ToastContext";
import { LoadingScreen } from "../components/ui/LoadingScreen";

export class RoleMismatchError extends Error {
  readonly expectedRole: Role;
  readonly actualRole: Role;

  constructor(expectedRole: Role, actualRole: Role) {
    super(
      `Akun ini bukan merupakan akun ${ROLE_META[expectedRole].label}. Silakan pilih role yang sesuai.`,
    );
    this.name = "RoleMismatchError";
    this.expectedRole = expectedRole;
    this.actualRole = actualRole;
  }
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload, expectedRole?: Role) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => User | null;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = getStoredUser();
    return storedUser ? applyLocalProfile(storedUser) : null;
  });
  const [initializing, setInitializing] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let active = true;
    const currentToken = getToken();

    if (!currentToken) {
      setInitializing(false);
      return;
    }

    authService
      .me()
      .then((response) => {
        if (!active) return;
        const nextUser = applyLocalProfile(response.user);
        setUser(nextUser);
        setStoredUser(nextUser);
        setTokenState(currentToken);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isUnauthorized(error) || isForbidden(error)) {
          clearSession();
          setUser(null);
          setTokenState(null);
        } else if (!getStoredUser()) {
          clearSession();
          setUser(null);
          setTokenState(null);
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setUser(null);
      setTokenState(null);
      toast.error(
        "Sesi berakhir",
        detail?.message ?? "Silakan masuk kembali untuk melanjutkan.",
      );
      if (location.pathname !== "/login") {
        navigate("/login?expired=1", { replace: true });
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
  }, [navigate, location.pathname, toast]);

  const login = useCallback(
    async (payload: LoginPayload, expectedRole?: Role) => {
      const response = await authService.login(payload);

      if (expectedRole && response.user.role !== expectedRole) {
        throw new RoleMismatchError(expectedRole, response.user.role);
      }

      const nextUser = applyLocalProfile(response.user);
      setToken(response.token);
      setTokenState(response.token);
      setStoredUser(nextUser);
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    return response.message;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setTokenState(null);
    toast.info("Berhasil keluar", "Sesi kamu telah diakhiri dengan aman.");
    navigate("/login", { replace: true });
  }, [navigate, toast]);

  const refreshProfile = useCallback(async () => {
    const response = await authService.me();
    const nextUser = applyLocalProfile(response.user);
    setUser(nextUser);
    setStoredUser(nextUser);
  }, []);

  const updateProfile = useCallback(
    (patch: ProfilePatch) => {
      if (!user) return null;
      const localProfile = saveLocalProfile(user.id, patch);
      const nextUser = { ...user, ...localProfile };
      setUser(nextUser);
      setStoredUser(nextUser);
      return nextUser;
    },
    [user],
  );

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      hasRole,
    }),
    [
      user,
      token,
      initializing,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      hasRole,
    ],
  );

  if (initializing) {
    return <LoadingScreen label="Memverifikasi sesi kamu…" />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return context;
}
