import { useEffect } from 'react';

/**
 * Invokes the provided callback whenever a pointer event occurs outside of
 * the DOM element referenced by `elementRef`.
 *
 * Used by the Sidebar component to close its mobile overlay when the user
 * clicks/taps on the main content area or backdrop.
 *
 * @param {React.RefObject<HTMLElement>} elementRef - Ref of the element to watch.
 * @param {() => void} onClickOutside - Callback invoked on an outside click.
 * @param {boolean} isActive - Whether the listener should currently be attached.
 *   Passing false (e.g. when a Sidebar is already closed) avoids attaching
 *   unnecessary global document listeners.
 */
const useClickOutside = (elementRef, onClickOutside, isActive = true) => {
  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (elementRef.current && !elementRef.current.contains(event.target)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [elementRef, onClickOutside, isActive]);
};

export default useClickOutside;
