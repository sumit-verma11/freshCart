import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from "lucide-react";

const CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Snacks",
  "Meat & Seafood",
];

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-auto">
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
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Premium groceries delivered fresh to your doorstep. We partner with local farmers
              and trusted brands to bring you the best.
            </p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center
                             hover:bg-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Shop by Category
            </h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/category/${encodeURIComponent(cat)}`}
                    className="text-sm text-gray-300 hover:text-secondary transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                ["About Us", "/about"],
                ["Blog", "/blog"],
                ["Careers", "/careers"],
                ["Terms & Conditions", "/terms"],
                ["Privacy Policy", "/privacy"],
                ["Return Policy", "/returns"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-gray-300 hover:text-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                123 MG Road, Bangalore — 560001, Karnataka, India
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Mail className="w-4 h-4 text-secondary shrink-0" />
                support@freshcart.in
              </li>
            </ul>

            <div className="mt-6">
              <p className="text-xs text-gray-400 mb-3 font-medium">We Accept</p>
              <div className="flex gap-2 flex-wrap">
                {["UPI", "Visa", "Mastercard", "COD"].map((p) => (
                  <span
                    key={p}
                    className="text-xs bg-white/10 px-3 py-1 rounded-lg font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row
                        items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FreshCart. All rights reserved.</p>
          <p>Made with 💚 in India</p>
        </div>
      </div>
    </footer>
  );
}
