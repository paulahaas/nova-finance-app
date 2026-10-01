import { useRef, useState } from 'react';

/**
 * Thin wrapper over the browser's native Web Speech API (free, no backend).
 * Works well in Chrome/Edge; Safari/iOS support is inconsistent, so callers
 * should hide the mic button entirely when `supported` is false rather than
 * show one that silently does nothing.
 */
export function useSpeechToText() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  function start(onResult) {
    if (!Recognition || listening) return;
    const rec = new Recognition();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return { supported: Boolean(Recognition), listening, start, stop };
}
