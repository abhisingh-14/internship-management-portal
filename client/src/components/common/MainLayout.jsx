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

const STUDENT_SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'My Profile', path: '/student/profile' },
  { label: 'Browse Internships', path: '/internships' },
  { label: 'My Applications', path: '/student/applications' },
  { label: 'Saved Internships', path: '/student/saved' },
  { label: 'Notifications', path: '/notifications' },
];

const COMPANY_SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/company/dashboard' },
  { label: 'Company Profile', path: '/company/profile' },
  { label: 'Manage Postings', path: '/company/postings' },
  { label: 'Applicants', path: '/company/applicants' },
  { label: 'Notifications', path: '/notifications' },
];

const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Admin Dashboard', path: '/admin/dashboard' },
  { label: 'Manage Users', path: '/admin/users' },
  { label: 'Verify Companies', path: '/admin/companies' },
  { label: 'Manage Internships', path: '/admin/internships' },
  { label: 'View Applications', path: '/admin/applications' },
  { label: 'Audit Logs', path: '/admin/audit-logs' },
  { label: 'Notifications', path: '/notifications' },
];

/**
 * Returns the navigation items Sidebar should render for the given role.
 */
function getSidebarItemsForRole(role) {
  if (role === 'admin') {
    return ADMIN_SIDEBAR_ITEMS;
  }
  if (role === 'company') {
    return COMPANY_SIDEBAR_ITEMS;
  }
  if (role === 'student') {
    return STUDENT_SIDEBAR_ITEMS;
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
