"use client"

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardSearch() {
  const [query, setQuery] = useState("");

  const triggerSearch = () => {
    if (query.trim().length >= 2) {
      window.dispatchEvent(new CustomEvent("app-search", { detail: query.trim() }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="glass border-border/40 flex items-center gap-2 px-4 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input 
          placeholder="Search token or patient..." 
          className="bg-transparent border-none outline-none text-xs w-32 md:w-48"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-9 px-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
        onClick={triggerSearch}
        disabled={query.trim().length < 2}
      >
        Search
      </Button>
    </div>
  );
}
