import { giantSizeFor } from '../config/cardTypes';

// The page's name as a giant word, like the "CRÉDITO" behind the card: pure
// decoration (the page itself keeps its own heading), so screen readers skip it.
export default function PageHero({ word }) {
  return (
    <div className="sc-pagehero" aria-hidden="true">
      <p className="sc-pageword" style={{ '--gd': giantSizeFor(word), '--gmax': 112 }}>
        {word}
      </p>
    </div>
  );
}
