import Link from "next/link";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const CATEGORIES = [
  { label: "Fruits & Vegetables", emoji: "🥦" },
  { label: "Dairy & Eggs",        emoji: "🥛" },
  { label: "Bakery",              emoji: "🍞" },
  { label: "Beverages",           emoji: "🧃" },
  { label: "Snacks",              emoji: "🍿" },
  { label: "Meat & Seafood",      emoji: "🐟" },
];

const QUICK_LINKS = [
  ["About Us",          "/about"],
  ["Blog",              "/blog"],
  ["Careers",           "/careers"],
  ["Terms & Conditions","/terms"],
  ["Privacy Policy",    "/privacy"],
  ["Return Policy",     "/returns"],
] as const;

const SOCIALS = [
  { Icon: IconInstagram, label: "Instagram", href: "#" },
  { Icon: IconX,         label: "X",         href: "#" },
  { Icon: IconFacebook,  label: "Facebook",  href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 dark:bg-black text-white mt-auto">
      {/* Gradient top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

      {/* Newsletter strip */}
      <div className="border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
                        flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="font-semibold text-white text-sm">
              🌿 Stay fresh — get weekly deals &amp; recipes
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Join 50,000+ shoppers. Unsubscribe any time.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary rounded-xl p-1.5">
                <Leaf className="w-5 h-5 text-white" />
              </span>
              <span className="text-xl font-bold">
                Fresh<span className="text-secondary">Cart</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Premium groceries delivered fresh to your doorstep. We partner with
              local farmers and trusted brands to bring you the best.
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/8 border border-white/10
                             flex items-center justify-center text-gray-400
                             hover:bg-primary hover:text-white hover:border-primary
                             transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* App badges */}
            <div className="flex gap-2 mt-5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs bg-white/8 border border-white/10
                               px-3 py-1.5 rounded-lg font-medium text-gray-300">
                🍎 App Store
              </span>
              <span className="flex items-center gap-1.5 text-xs bg-white/8 border border-white/10
                               px-3 py-1.5 rounded-lg font-medium text-gray-300">
                🤖 Google Play
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-500 mb-5">
              Shop by Category
            </h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map(({ label, emoji }) => (
                <li key={label}>
                  <Link
                    href={`/category/${encodeURIComponent(label)}`}
                    className="flex items-center gap-2 text-sm text-gray-400
                               hover:text-secondary transition-colors group"
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-500 mb-5">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-secondary
                               transition-colors group flex items-center gap-1.5"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-500 mb-5">
              Contact Us
            </h3>
            <ul className="space-y-3.5 mb-6">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                Raja Bazar, Motihari — 845401, Bihar, India
              </li>
              <li>
                <a
                  href="tel:+918521618863"
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-secondary shrink-0" />
                  +91 85216 18863
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@freshcart.in"
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-secondary shrink-0" />
                  support@freshcart.in
                </a>
              </li>
            </ul>

            {/* Payment methods */}
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
                We Accept
              </p>
              <div className="flex gap-2 flex-wrap">
                {["UPI", "Visa", "Mastercard", "COD"].map((p) => (
                  <span
                    key={p}
                    className="text-xs bg-white/8 border border-white/10 px-3 py-1
                               rounded-lg font-medium text-gray-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5
                        flex flex-col sm:flex-row items-center justify-between gap-3
                        text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FreshCart. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Made with 💚 in India</span>
            <span className="text-gray-700">·</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
