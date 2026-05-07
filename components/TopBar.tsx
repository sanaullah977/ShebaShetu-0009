"use client"

import { Bell, Search } from "lucide-react";
import { Logo } from "./Logo";
import { RoleBadge } from "./RoleBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface TopBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "US";

  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>

        {/* search — desktop only */}
        <div className="hidden md:flex flex-1 max-w-md ml-2">
          <div className="glass flex items-center gap-2 w-full rounded-full px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search doctors, departments, tokens…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
            />
            <kbd className="hidden lg:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RoleBadge role={user.role as any} />

          <button className="relative glass glass-hover h-9 w-9 grid place-items-center rounded-full">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              3
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="glass glass-hover h-9 w-9 grid place-items-center rounded-full text-xs font-semibold">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Profile settings</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Help & support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
