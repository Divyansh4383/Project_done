import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

function readSession() {
  try {
    return JSON.parse(localStorage.getItem("sprintforge.session") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  function storeSession(auth) {
    const next = {
      token: auth.token,
      refreshToken: auth.refreshToken,
      user: auth.user,
    };
    localStorage.setItem("sprintforge.token", next.token);
    localStorage.setItem("sprintforge.session", JSON.stringify(next));
    setSession(next);
  }

  async function login(email, password) {
    storeSession(await api("/auth/login", {
      method: "POST",
      body: { email, password },
    }));
  }

  async function register(email, password, displayName) {
    storeSession(await api("/auth/register", {
      method: "POST",
      body: { email, password, displayName },
    }));
  }

  async function logout() {
    const refreshToken = session?.refreshToken;
    try {
      if (refreshToken) {
        await api("/auth/logout", {
          method: "POST",
          body: { refreshToken },
        });
      }
    } finally {
      localStorage.removeItem("sprintforge.token");
      localStorage.removeItem("sprintforge.session");
      setSession(null);
    }
  }

  const value = useMemo(
    () => ({ session, login, register, logout }),
    [session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
