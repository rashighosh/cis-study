import { useState, useRef, useEffect } from "react";

const CYCLE_MS = 1900;
const CARD_WIDTH = 200;
const FIRST_PAUSE_MS = 900; // how long first card lingers

const CARDS = [
  { id: 1, title: "Searching NCI", subtitle: "National Cancer Institute" },
  { id: 2, title: "Searching NIH", subtitle: "National Institutes of Health resources"  },
  { id: 3, title: "Searching FDA", subtitle: "Federal Drug Administration resources" },
  { id: 4, title: "Searching HHS", subtitle: "Department of Health & Human Services resources" },
];

export default function SwipingCards() {
  const [offset, setOffset] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const prevOffset = useRef(0);

  useEffect(() => {
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;

      // Still in the initial pause — card sits still
      if (elapsed < FIRST_PAUSE_MS) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      // Loop starts only after the pause
      const loopElapsed = elapsed - FIRST_PAUSE_MS;
      const t = (loopElapsed % CYCLE_MS) / CYCLE_MS;
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const newOffset = eased * CARD_WIDTH;

      if (prevOffset.current > CARD_WIDTH * 0.9 && newOffset < CARD_WIDTH * 0.1) {
        setSwipeCount(c => c + 1);
      }
      prevOffset.current = newOffset;
      setOffset(newOffset);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="swipe-cards">
      {[0, 1, 2].map((layer) => {
        const card = CARDS[(swipeCount + layer) % CARDS.length];
        const x = layer === 0 ? offset : offset - CARD_WIDTH * layer;
        return (
          <div
            key={layer}
            className="swipe-card"
            style={{
              transform: `translateX(${x}px) scale(${1 - layer * 0.05})`,
              opacity: layer === 2 ? 0.4 : 1,
              zIndex: 3 - layer,
            }}
          >
            <div className="swipe-card__title">{card.title}</div>
            <div className="swipe-card__subtitle">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}