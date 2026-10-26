import { useRef } from 'react';
import { Camera } from 'lucide-react';

/** A camera button: pick or take a photo of a receipt and hand the file back. */
export default function ReceiptButton({ onFile, disabled }) {
  const inputRef = useRef(null);
  return (
    <>
      <button
        type="button"
        aria-label="Ler uma nota por foto"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 w-12 h-12 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] flex items-center justify-center transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
      >
        <Camera size={18} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}
