import { useCallback, useState } from 'react';

/**
 * Generic boolean-toggle hook.
 *
 * Used throughout the layout (Sidebar open/close, mobile Navbar menu, and
 * any future dropdown/modal visibility) so components don't each
 * reimplement the same open/close state logic locally.
 *
 * @param {boolean} initialValue - Starting value of the toggle (default false).
 * @returns {[boolean, () => void, (value: boolean) => void]} A tuple of:
 *   - value:    the current boolean state.
 *   - toggle:   flips the current value.
 *   - setValue: explicitly sets the value (e.g., force-close on navigation).
 */
const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((previousValue) => !previousValue);
  }, []);

  return [value, toggle, setValue];
};

export default useToggle;
