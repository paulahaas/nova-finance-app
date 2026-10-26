import clsx from 'clsx';
import CardFace from './CardFace';

/** A non-interactive card. `width` (px) sizes it; everything inside scales with it. */
export default function FlatCard({ type, width, className, style, ...face }) {
  return (
    <div className={clsx('nc-flat', className)} data-card={type} style={{ ...(width ? { '--cw': `${width}px` } : null), ...style }}>
      <div className="nc-face">
        <CardFace type={type} {...face} />
      </div>
    </div>
  );
}
