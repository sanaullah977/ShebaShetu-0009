"use client"

import { Stethoscope, UserRound, ClipboardList, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "PATIENT" | "RECEPTION" | "DOCTOR" | "ADMIN" | "SUPER_ADMIN";

const ROLE_META: Record<string, { label: string; icon: typeof UserRound; dot: string }> = {
  PATIENT:   { label: "Patient",   icon: UserRound,     dot: "bg-primary" },
  RECEPTION: { label: "Reception", icon: ClipboardList, dot: "bg-warning" },
  DOCTOR:    { label: "Doctor",    icon: Stethoscope,   dot: "bg-sky-400" },
  ADMIN:     { label: "Admin",     icon: ClipboardList, dot: "bg-orange-500" },
  SUPER_ADMIN: { label: "S. Admin", icon: ClipboardList, dot: "bg-purple-500" },
};

interface RoleBadgeProps {
  role?: Role;
}

export function RoleBadge({ role = "PATIENT" }: RoleBadgeProps) {
  const meta = ROLE_META[role] || ROLE_META.PATIENT;
  const Icon = meta.icon;

  return (
    <div className="glass flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-xs font-medium cursor-default">
      <span className={cn("h-2 w-2 rounded-full ring-2 ring-background", meta.dot)} />
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{meta.label}</span>
    </div>
  );
}
