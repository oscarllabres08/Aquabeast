type SkeletonBlockProps = {
  width?: string;
  height?: number;
  radius?: number;
};

export function SkeletonBlock({ width = '100%', height = 12, radius = 10 }: SkeletonBlockProps) {
  return (
    <div
      className="skeleton shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  );
}

export function WebPageSkeleton() {
  return (
    <section className="card" aria-label="Loading">
      <div className="skeleton-stack">
        <SkeletonBlock width="38%" height={14} />
        <SkeletonBlock width="62%" height={24} />
        <SkeletonBlock width="100%" height={110} radius={16} />
        <SkeletonBlock width="100%" height={70} radius={16} />
        <SkeletonBlock width="100%" height={70} radius={16} />
      </div>
    </section>
  );
}

export function OrderPageSkeleton() {
  return (
    <section className="card" aria-label="Loading menu">
      <div className="skeleton-stack">
        <SkeletonBlock width="100%" height={42} radius={12} />
        <SkeletonBlock width="100%" height={88} radius={16} />
        <SkeletonBlock width="100%" height={88} radius={16} />
        <SkeletonBlock width="100%" height={88} radius={16} />
      </div>
    </section>
  );
}

export function OrderDetailsSkeleton() {
  return (
    <>
      <section className="card" aria-label="Loading order">
        <div className="skeleton-stack">
          <SkeletonBlock width="36%" />
          <SkeletonBlock width="60%" height={22} />
          <SkeletonBlock width="100%" height={54} radius={14} />
        </div>
      </section>
      <section className="card" aria-label="Loading items">
        <div className="skeleton-stack">
          <SkeletonBlock width="28%" height={20} />
          <SkeletonBlock width="100%" height={62} radius={14} />
          <SkeletonBlock width="100%" height={62} radius={14} />
        </div>
      </section>
    </>
  );
}

export function ProfilePageSkeleton() {
  return (
    <>
      <section className="card">
        <div className="skeleton-stack">
          <SkeletonBlock width="100%" height={94} radius={18} />
        </div>
      </section>
      <section className="card">
        <div className="skeleton-stack">
          <SkeletonBlock width="34%" />
          <SkeletonBlock width="100%" height={72} radius={14} />
          <SkeletonBlock width="100%" height={72} radius={14} />
        </div>
      </section>
    </>
  );
}

export function FormPageSkeleton() {
  return (
    <section className="card" aria-label="Loading form">
      <div className="skeleton-stack">
        <SkeletonBlock width="38%" height={22} />
        <SkeletonBlock width="52%" />
        <SkeletonBlock width="100%" height={46} radius={12} />
        <SkeletonBlock width="100%" height={46} radius={12} />
        <SkeletonBlock width="100%" height={46} radius={12} />
        <SkeletonBlock width="34%" height={40} radius={12} />
      </div>
    </section>
  );
}
