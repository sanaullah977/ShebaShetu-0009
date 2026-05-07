import { useRole, type Role } from "@/lib/role-store";
import { Stethoscope, UserRound, ClipboardList, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const ROLE_META: Record<Role, { label: string; icon: typeof UserRound; dot: string; route: string }> = {
  patient:   { label: "Patient",   icon: UserRound,     dot: "bg-primary",     route: "/patient" },
  reception: { label: "Reception", icon: ClipboardList, dot: "bg-warning",     route: "/reception" },
  doctor:    { label: "Doctor",    icon: Stethoscope,   dot: "bg-sky-400",     route: "/doctor" },
};

export function RoleBadge() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const switchTo = (r: Role) => {
    setRole(r);
    navigate(ROLE_META[r].route);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass glass-hover flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-xs font-medium">
          <span className={`h-2 w-2 rounded-full ${meta.dot} ring-2 ring-background`} />
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{meta.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong border-border/60 w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch role (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(ROLE_META) as Role[]).map((r) => {
          const m = ROLE_META[r];
          const I = m.icon;
          return (
            <DropdownMenuItem
              key={r}
              onClick={() => switchTo(r)}
              className="gap-2 cursor-pointer"
            >
              <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              <I className="h-4 w-4" />
              <span>{m.label}</span>
              {r === role && <span className="ml-auto text-[10px] text-primary">active</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
