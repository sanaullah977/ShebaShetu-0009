import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "patient" | "reception" | "doctor";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}

const RoleContext = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("ss-role") as Role | null) : null;
    return stored ?? "patient";
  });

  useEffect(() => {
    localStorage.setItem("ss-role", role);
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole: setRoleState }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
