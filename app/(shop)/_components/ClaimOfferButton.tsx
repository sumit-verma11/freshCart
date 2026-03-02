"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";

/**
 * "Claim Offer" button / inline link that adapts based on auth state:
 *   - Logged-in  → scrolls to the shop section (user can already shop)
 *   - Guest      → goes to /register (new-user offer)
 */

export function ClaimOfferButton() {
  const { status } = useSession();
  const href = status === "authenticated" ? "/#shop" : "/register";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 bg-secondary text-white font-bold
                 text-lg px-8 py-4 rounded-2xl hover:bg-secondary-500 active:scale-95
                 transition-all duration-200 shadow-lg shrink-0"
    >
      {status === "authenticated" ? "Shop Now" : "Claim Offer"}
      <ArrowRight className="w-5 h-5" />
    </Link>
  );
}

export function ClaimOfferLink() {
  const { status } = useSession();
  const href = status === "authenticated" ? "/#shop" : "/register";

  return (
    <Link href={href} className="underline text-primary ml-2 font-semibold hover:text-primary-600">
      {status === "authenticated" ? "Shop Now →" : "Claim →"}
    </Link>
  );
}
