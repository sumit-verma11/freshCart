import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero flex flex-col">
      <div className="flex justify-center pt-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-primary rounded-xl p-1.5">
            <Leaf className="w-5 h-5 text-white" />
          </span>
          <span className="text-xl font-bold text-dark">
            Fresh<span className="text-primary">Cart</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
