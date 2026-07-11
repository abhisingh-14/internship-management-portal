import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import useClickOutside from '../../hooks/useClickOutside';

/**
 * Collapsible side navigation column.
 *
 * Reusable and role-agnostic: it renders whatever `items` it is given
 * rather than hard-coding role-specific links. On desktop widths it is
 * always visible (see the CSS rules in `index.css`); on mobile widths it
 * behaves as a slide-in overlay controlled by `isOpen`/`onClose`.
 *
 * Student/Company/Admin dashboard pages (built in later components) are
 * expected to supply their own role-specific `items` array once those
 * routes exist. Until then, MainLayout supplies a small generic default.
 */
const Sidebar = ({ isOpen, onClose, items = [{ label: 'Home', path: '/' }] }) => {
  const sidebarRef = useRef(null);

  useClickOutside(sidebarRef, onClose, isOpen);

  return (
    <>
      {isOpen && (
        <div className="sidebar-backdrop d-md-none" onClick={onClose} role="presentation" />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar bg-light border-end${isOpen ? ' sidebar-open' : ''}`}
      >
        <nav className="nav flex-column p-3">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link sidebar-link${isActive ? ' active fw-semibold' : ''}`
              }
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ),
};

export default Sidebar;
