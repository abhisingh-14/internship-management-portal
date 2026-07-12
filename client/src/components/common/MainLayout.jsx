import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import useToggle from '../../hooks/useToggle';
import useWindowWidth from '../../hooks/useWindowWidth';
import useAuth from '../../hooks/useAuth';

const DESKTOP_BREAKPOINT_PX = 768;

const DEFAULT_SIDEBAR_ITEMS = [{ label: 'Home', path: '/' }];

const COMPANY_SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/company/dashboard' },
  { label: 'Company Profile', path: '/company/profile' },
];

/**
 * Returns the navigation items Sidebar should render for the given role.
 * Student and Admin item sets are intentionally not added here — they
 * belong to the components that introduce those dashboards, following
 * the same pattern established for 'company' in this component.
 */
function getSidebarItemsForRole(role) {
  if (role === 'company') {
    return COMPANY_SIDEBAR_ITEMS;
  }
  return DEFAULT_SIDEBAR_ITEMS;
}

function MainLayout() {
  const [isSidebarOpen, toggleSidebar, setSidebarOpen] = useToggle(false);
  const windowWidth = useWindowWidth();
  const { user } = useAuth();

  useEffect(() => {
    if (windowWidth >= DESKTOP_BREAKPOINT_PX) {
      setSidebarOpen(false);
    }
  }, [windowWidth, setSidebarOpen]);

  const sidebarItems = getSidebarItemsForRole(user?.role);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onSidebarToggle={toggleSidebar} />
      <div className="d-flex flex-grow-1">
        <Sidebar items={sidebarItems} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-grow-1 p-3">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default MainLayout;
