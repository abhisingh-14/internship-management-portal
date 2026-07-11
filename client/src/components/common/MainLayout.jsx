import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import useToggle from '../../hooks/useToggle';
import useWindowWidth from '../../hooks/useWindowWidth';

/** Bootstrap's `md` breakpoint in pixels — matches the CSS rules in index.css. */
const MOBILE_BREAKPOINT_PX = 768;

const DEFAULT_SIDEBAR_ITEMS = [{ label: 'Home', path: '/' }];

/**
 * Root layout shell composing the Navbar, collapsible Sidebar, main content
 * outlet, and Footer.
 *
 * Every route rendered through `AppRoutes` is nested under this layout so
 * the Navbar/Sidebar/Footer appear consistently across the whole app. The
 * mobile sidebar's open/closed state is local component state (via the
 * `useToggle` hook) rather than a new global Context — per
 * `docs/04_Project_Architecture.md` §12, `AuthContext` is the only piece of
 * state meant to be accessible application-wide, and this state is only
 * ever needed by the layout itself.
 *
 * Role-specific Sidebar content is intentionally NOT wired up here yet:
 * Student/Company/Admin dashboard pages (introduced by later components)
 * are expected to supply their own sidebar item list once those routes and
 * pages exist. For now, a small generic default list is used.
 */
const MainLayout = () => {
  const [isSidebarOpen, toggleSidebar, setSidebarOpen] = useToggle(false);
  const windowWidth = useWindowWidth();

  // Auto-close the mobile sidebar overlay if the viewport is resized back
  // up to a desktop width, where the sidebar is always visible via CSS.
  useEffect(() => {
    if (windowWidth >= MOBILE_BREAKPOINT_PX) {
      setSidebarOpen(false);
    }
  }, [windowWidth, setSidebarOpen]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="d-flex flex-grow-1 app-body">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          items={DEFAULT_SIDEBAR_ITEMS}
        />
        <main className="flex-grow-1 main-content p-3 p-md-4">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
