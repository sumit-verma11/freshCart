/** Reusable skeleton / loading placeholder components */

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  );
}

/** Matches the shape of a ProductCard */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
      {/* Image area */}
      <SkeletonBox className="aspect-square rounded-none" />
      {/* Info area */}
      <div className="p-3 space-y-2">
        <SkeletonBox className="h-3 w-1/3" />
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/4" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonBox className="h-5 w-16" />
          <SkeletonBox className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Full-page product grid skeleton (N cards) */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches the product detail page hero */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <SkeletonBox className="h-4 w-12" />
        <SkeletonBox className="h-4 w-4 rounded-full" />
        <SkeletonBox className="h-4 w-24" />
      </div>
      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        <SkeletonBox className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-8 w-3/4" />
          <SkeletonBox className="h-4 w-16" />
          <SkeletonBox className="h-10 w-32" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
          <div className="space-y-3 pt-4">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-5/6" />
            <SkeletonBox className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Category card skeleton */
export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border p-4 flex flex-col items-center gap-3">
      <SkeletonBox className="w-16 h-16 rounded-full" />
      <SkeletonBox className="h-4 w-20" />
    </div>
  );
}

/** Order card skeleton */
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBox className="h-4 w-48" />
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>
      <div className="flex justify-between items-center pt-1">
        <SkeletonBox className="h-5 w-24" />
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}
