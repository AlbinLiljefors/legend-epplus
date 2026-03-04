import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const EMAIL_KEY = "legend-user-email";
const NAME_KEY = "legend-user-name";

declare global {
  interface Window {
    posthog?: {
      identify: (id: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

/** Minimal user shape that satisfies useAuth() consumers (GraphView, RepoSelection, etc.) */
interface LocalUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: LocalUser | null;
  loading: boolean;
  signIn: (name: string, email?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser(): LocalUser | null {
  const email = localStorage.getItem(EMAIL_KEY);
  const name = localStorage.getItem(NAME_KEY);
  if (name) {
    const resolvedEmail = email || `${name.replace(/\s+/g, ".")}@anonymous`;
    return { id: resolvedEmail, email: resolvedEmail, name };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(() => {
    const stored = getStoredUser();
    if (stored) {
      window.posthog?.identify(stored.email, { email: stored.email, name: stored.name });
    }
    return stored;
  });

  const signIn = useCallback(async (name: string, email?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return { error: 'Name is required' };
    const resolvedEmail = email?.trim().toLowerCase() || `${trimmedName.replace(/\s+/g, ".")}@anonymous`;

    localStorage.setItem(EMAIL_KEY, resolvedEmail);
    localStorage.setItem(NAME_KEY, trimmedName);
    window.posthog?.identify(resolvedEmail, { email: resolvedEmail, name: trimmedName });

    setUser({ id: resolvedEmail, email: resolvedEmail, name: trimmedName });
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(NAME_KEY);
    window.posthog?.reset();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
