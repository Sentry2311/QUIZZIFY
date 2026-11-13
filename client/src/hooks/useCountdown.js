import { useEffect, useMemo, useState } from 'react';

/**
 * Counts down to an absolute timestamp.
 * @param {number|null} endsAt - epoch ms when time runs out.
 * @param {number} totalSeconds - full duration, used for the progress bar.
 */
export function useCountdown(endsAt, totalSeconds = 20) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  return useMemo(() => {
    if (!endsAt) return { secondsLeft: totalSeconds, progress: 1, expired: false };
    const remainingMs = Math.max(0, endsAt - now);
    return {
      secondsLeft: Math.ceil(remainingMs / 1000),
      progress: Math.min(1, remainingMs / (totalSeconds * 1000)),
      expired: remainingMs <= 0,
    };
  }, [endsAt, now, totalSeconds]);
}
