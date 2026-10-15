"use client";

import { useEffect, useId } from "react";

/**
 * Open layers, innermost last.
 *
 * Quick views open each other — an order's chat thread from inside the order,
 * an evidence photo from inside a complaint — and every one listens for Escape
 * on the document. Without a stack, one key press closed all of them at once
 * instead of the one on top.
 */
const openLayers: string[] = [];

/**
 * The two rules every modal layer follows: Escape closes it (only when it is on
 * top), and the page behind does not scroll while it is open.
 */
export function useDialogLayer(onClose: () => void) {
  const id = useId();

  useEffect(() => {
    openLayers.push(id);

    return () => {
      const index = openLayers.indexOf(id);
      if (index !== -1) openLayers.splice(index, 1);
    };
  }, [id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openLayers[openLayers.length - 1] === id) onClose();
    };

    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [id, onClose]);
}
