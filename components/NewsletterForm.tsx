"use client";

import { ArrowRight } from "lucide-react";

export default function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex gap-2 w-full sm:w-auto"
    >
      <input
        type="email"
        placeholder="your@email.com"
        className="flex-1 sm:w-60 bg-white/8 border border-white/15 rounded-xl
                   px-4 py-2.5 text-sm text-white placeholder:text-gray-500
                   focus:outline-none focus:ring-2 focus:ring-primary/50
                   focus:border-primary/60 transition-all"
      />
      <button
        type="submit"
        className="flex items-center gap-1.5 bg-primary hover:bg-primary-600
                   text-white text-sm font-semibold px-4 py-2.5 rounded-xl
                   transition-colors shrink-0"
      >
        Subscribe <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
