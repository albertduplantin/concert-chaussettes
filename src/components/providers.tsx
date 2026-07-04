"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

interface SessionUser {
  id: string;
  email: string;
  role: "GROUPE" | "ORGANISATEUR" | "ADMIN";
}

interface Session {
  user: SessionUser;
}

interface SessionContextType {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  data: null,
  status: "loading",
  update: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

function SessionProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >(initialSession ? "authenticated" : "unauthenticated");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();

      if (data?.user) {
        setSession(data);
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ data: session, status, update: fetchSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function Providers({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <SessionProvider initialSession={initialSession}>
        {children}
        <Toaster />
      </SessionProvider>
    </ErrorBoundary>
  );
}
