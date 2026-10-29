import { useRef, type KeyboardEvent } from "react";

export function usePasswordComposition() {
  const composingRef = useRef(false);
  const inputProps = {
    onCompositionStart: () => {
      composingRef.current = true;
    },
    onCompositionEnd: () => {
      composingRef.current = false;
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (
        event.key === "Enter" &&
        (composingRef.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)
      ) {
        event.preventDefault();
      }
    },
  };
  return { inputProps, isComposing: () => composingRef.current };
}
