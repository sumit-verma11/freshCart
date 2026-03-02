"use client";

import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  name: string;
  description: string;
}

export default function ShareButton({ name, description }: ShareButtonProps) {
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: description, url });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full
                 bg-gray-100 text-muted hover:bg-accent hover:text-primary
                 transition-colors shrink-0"
      aria-label="Share product"
    >
      <Share2 className="w-4 h-4" />
    </button>
  );
}
