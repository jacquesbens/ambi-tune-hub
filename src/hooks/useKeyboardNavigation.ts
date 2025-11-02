import { useEffect, useState, useCallback } from "react";

interface UseKeyboardNavigationProps {
  itemCount: number;
  onSelect?: (index: number) => void;
  onBack?: () => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  itemCount,
  onSelect,
  onBack,
  enabled = true,
}: UseKeyboardNavigationProps) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "ArrowLeft":
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "ArrowRight":
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1));
          break;
        case "Enter":
          event.preventDefault();
          if (onSelect) {
            onSelect(focusedIndex);
          }
          break;
        case "Backspace":
        case "Escape":
          event.preventDefault();
          if (onBack) {
            onBack();
          }
          break;
      }
    },
    [enabled, focusedIndex, itemCount, onSelect, onBack]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { focusedIndex, setFocusedIndex };
};
