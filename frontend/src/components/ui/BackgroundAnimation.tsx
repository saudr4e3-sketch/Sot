import React from 'react';

type Props = {
  className?: string;
  /** If true, render using fixed positioning (covers viewport). If false, uses absolute positioning (relative to parent). Default: true */
  fixed?: boolean;
  /** When true disables animations (useful for tests or explicit developer control) */
  disableAnimation?: boolean;
};

const BackgroundAnimation: React.FC<Props> = ({ className = '', fixed = true, disableAnimation = false }) => {
  const positionStyle: React.CSSProperties = fixed
    ? { position: 'fixed', inset: 0 }
    : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        ...positionStyle,
        zIndex: -10,
        pointerEvents: 'none',
        overflow: 'hidden',
        // Ensure the element doesn't create a layering context that blocks clicks
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <style>{`
        .bg-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(48px);
          opacity: 0.75;
          transform: translate3d(0,0,0);
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* Blobs */
        .bg-blob.b1 { width: 520px; height: 520px; left: -10%; top: -12%; background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.9), rgba(99,102,241,0.6) 40%, rgba(99,102,241,0.0) 70%); animation: float1 18s ease-in-out infinite; }
        .bg-blob.b2 { width: 420px; height: 420px; right: -8%; top: 18%; background: radial-gradient(circle at 70% 30%, rgba(16,185,129,0.85), rgba(16,185,129,0.45) 40%, rgba(16,185,129,0.0) 70%); animation: float2 20s ease-in-out infinite; }
        .bg-blob.b3 { width: 360px; height: 360px; left: 18%; bottom: -8%; background: radial-gradient(circle at 40% 60%, rgba(14,165,233,0.8), rgba(14,165,233,0.4) 40%, rgba(14,165,233,0.0) 70%); animation: float3 22s ease-in-out infinite; opacity: 0.6; }

        @keyframes float1 {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(30px) translateX(20px) scale(1.05); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }
        @keyframes float2 {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(-25px) translateX(-30px) scale(0.97); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }
        @keyframes float3 {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(20px) translateX(-10px) scale(1.02); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .bg-blob { animation: none !important; transition: none !important; }
          .bg-blob { filter: blur(12px); }
        }

        /* Hide on small screens to improve performance */
        @media (max-width: 640px) {
          .bg-blob.b1, .bg-blob.b2, .bg-blob.b3 { display: none; }
        }

        /* Developer override to disable animations */
        .bg-blob.disable-anim { animation: none !important; }
      `}</style>

      <div className={`bg-blob b1 ${disableAnimation ? 'disable-anim' : ''}`} />
      <div className={`bg-blob b2 ${disableAnimation ? 'disable-anim' : ''}`} />
      <div className={`bg-blob b3 ${disableAnimation ? 'disable-anim' : ''}`} />
    </div>
  );
};

export default React.memo(BackgroundAnimation);
