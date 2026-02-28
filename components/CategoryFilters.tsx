"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  sort: string;
  onlyOrganic: boolean;
  category: string;
}

export default function CategoryFilters({ sort, onlyOrganic, category }: Props) {
  const router = useRouter();

  function navigate(newSort: string, newOrganic: boolean) {
    const params = new URLSearchParams();
    if (newSort !== "default") params.set("sort", newSort);
    if (newOrganic) params.set("organic", "true");
    const qs = params.toString();
    router.push(`/category/${encodeURIComponent(category)}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(sort, !onlyOrganic)}
        className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all
                    ${onlyOrganic
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted hover:border-primary hover:text-primary"
                    }`}
      >
        🌱 Organic Only
      </button>

      <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 text-sm text-muted">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        <select
          value={sort}
          onChange={(e) => navigate(e.target.value, onlyOrganic)}
          className="bg-transparent outline-none text-dark text-sm font-medium cursor-pointer"
        >
          <option value="default">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
  );
}
