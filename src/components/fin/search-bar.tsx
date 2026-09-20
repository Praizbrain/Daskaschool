import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: "/students", search: { q } });
    setQuery("");
  };

  return (
    <form onSubmit={handleSearch} className="relative flex h-11 flex-1 max-w-md items-center">
      <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search students by name or admission number…"
        className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
      />
    </form>
  );
}
