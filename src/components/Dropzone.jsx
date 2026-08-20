import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import clsx from 'clsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drag-and-drop + click-to-browse file picker for statement imports.
 * @param {{ accept: string, onFile: (file: File) => void, error?: string }} props
 */
export default function Dropzone({ accept = '.csv,.ofx', onFile, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);

  function handleFiles(fileList) {
    const picked = fileList?.[0];
    if (!picked) return;
    setFile(picked);
    onFile(picked);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
    onFile(null);
  }

  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={24} className="shrink-0 text-[var(--color-accent)]" />
          <div className="min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-[var(--color-text-dim)]">{formatSize(file.size)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          aria-label="Remover arquivo"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={clsx(
          'w-full flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-colors min-h-[180px]',
          dragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-faint)]'
        )}
      >
        <UploadCloud size={32} className="text-[var(--color-text-dim)]" />
        <div>
          <p className="font-medium">Arraste seu extrato aqui</p>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">ou toque para escolher um arquivo CSV ou OFX</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-3 text-sm text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}
