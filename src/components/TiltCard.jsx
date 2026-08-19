import { useRef } from 'react';

const MAX_TILT = 6; // degrees — subtle on purpose, not a gimmick

// Bank cards get a cursor-tracking tilt on desktop (the "this has weight"
// feel) and a simple press-scale on touch, where mousemove doesn't apply.
export default function TiltCard({ children, className, ...props }) {
  const ref = useRef(null);

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (el) el.style.transform = '';
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transition: 'transform 0.15s ease-out' }}
      {...props}
    >
      {children}
    </div>
  );
}
