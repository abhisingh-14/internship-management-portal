import { useEffect, useState } from 'react';

/**
 * Tracks the current browser viewport width, updated on window resize.
 *
 * Used by layout components (e.g. MainLayout) to react to responsive
 * breakpoint changes — such as auto-closing the mobile Sidebar overlay
 * when the viewport is resized back up to a desktop width — without each
 * component attaching and cleaning up its own resize listener.
 *
 * @returns {number} The current window width in pixels.
 */
const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowWidth;
};

export default useWindowWidth;
