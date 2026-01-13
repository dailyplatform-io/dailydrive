import { useEffect } from 'react';

export function DisableNumberInputScroll() {
  useEffect(() => {
    const options: AddEventListenerOptions = { passive: true, capture: true };
    const onWheel = (event: WheelEvent) => {
      const active = document.activeElement;
      if (!(active instanceof HTMLInputElement)) return;
      if (active.type !== 'number') return;
      active.blur();
    };

    window.addEventListener('wheel', onWheel, options);
    return () => window.removeEventListener('wheel', onWheel, options);
  }, []);

  return null;
}
