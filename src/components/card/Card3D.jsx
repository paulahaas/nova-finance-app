import { useEffect, useMemo, useRef, useState } from 'react';
import CardFace from './CardFace';

const SLICES = [-2, -1, 0, 1, 2];

/**
 * A card you can drag to spin 360 degrees. It keeps turning gently on its
 * own, has a little thickness, and a highlight that sweeps across as it
 * rotates. `kick` is a counter: raising it gives the card a quick whirl (used
 * when the type changes).
 */
export default function Card3D({ type, kick = 0, ...face }) {
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const shadowRef = useRef(null);
  const motion = useRef({ ry: -24, rx: -6, vel: 0, dragging: false, lastX: 0, lastY: 0, inView: true });
  const [hintGone, setHintGone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    if (kick && !reduced) motion.current.vel += 22;
  }, [kick, reduced]);

  useEffect(() => {
    const m = motion.current;
    const idle = reduced ? 0 : 0.32;
    let raf;
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => (m.inView = entry.isIntersecting)) : null;
    if (stageRef.current) observer?.observe(stageRef.current);

    function frame() {
      if (m.inView && cardRef.current) {
        if (!m.dragging) {
          m.ry += m.vel;
          m.vel += (idle - m.vel) * 0.035;
          m.rx += (-6 - m.rx) * 0.06;
        }
        const turn = ((m.ry % 360) + 360) % 360;
        const style = cardRef.current.style;
        style.setProperty('--ry', `${m.ry.toFixed(2)}deg`);
        style.setProperty('--rx', `${m.rx.toFixed(2)}deg`);
        style.setProperty('--shine', `${((turn / 360) * 170 - 35).toFixed(1)}%`);
        if (shadowRef.current) shadowRef.current.style.transform = `scaleX(${(0.45 + 0.55 * Math.abs(Math.cos((m.ry * Math.PI) / 180))).toFixed(3)})`;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [reduced]);

  function onPointerDown(e) {
    const m = motion.current;
    m.dragging = true;
    m.lastX = e.clientX;
    m.lastY = e.clientY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture is a nicety */
    }
    setDragging(true);
    setHintGone(true);
  }
  function onPointerMove(e) {
    const m = motion.current;
    if (!m.dragging) return;
    const dx = e.clientX - m.lastX;
    const dy = e.clientY - m.lastY;
    m.ry += dx * 0.7;
    m.rx = Math.max(-24, Math.min(24, m.rx - dy * 0.25));
    m.vel = dx * 0.7;
    m.lastX = e.clientX;
    m.lastY = e.clientY;
  }
  function endDrag() {
    motion.current.dragging = false;
    setDragging(false);
  }
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') motion.current.vel -= 9;
    else if (e.key === 'ArrowRight') motion.current.vel += 9;
    else return;
    setHintGone(true);
    e.preventDefault();
  }

  return (
    <div
      ref={stageRef}
      className={dragging ? 'nc-stage dragging' : 'nc-stage'}
      tabIndex={0}
      role="img"
      aria-label="Cartão em 3D. Arraste para girar, ou use as setas do teclado."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={onKeyDown}
    >
      <div ref={cardRef} className="nc-card3d" data-card={type}>
        {SLICES.map((z) => (
          <div key={z} className="nc-slice" style={{ '--z': `${z}px` }} />
        ))}
        <div className="nc-face front">
          <CardFace type={type} {...face} />
        </div>
        <div className="nc-face back">
          <div className="nc-stripe" />
          <div className="nc-sign">
            <span>Assinatura</span>
            <b>123</b>
          </div>
          <p className="nc-fine">
            CARTÃO ILUSTRATIVO
            <br />
            NOVA
          </p>
        </div>
      </div>
      <div ref={shadowRef} className="nc-shadow" />
      <div className={hintGone ? 'nc-hint gone' : 'nc-hint'}>↔&nbsp; arraste para girar</div>
    </div>
  );
}
