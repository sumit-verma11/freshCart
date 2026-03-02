import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-8xl mb-6">📶</div>
      <h1 className="text-2xl font-bold text-dark mb-3">You&apos;re offline</h1>
      <p className="text-muted mb-8 max-w-xs">
        No internet connection detected. Your cart is saved locally and will sync when
        you&apos;re back online.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/cart"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          🛒 View Cart
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="btn-outline inline-flex items-center justify-center gap-2"
        >
          ↻ Try Again
        </button>
      </div>
    </div>
  );
}
