import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/common/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleRoute from '../components/common/RoleRoute';
import Home from '../pages/shared/Home';
import NotFound from '../pages/shared/NotFound';
import Unauthorized from '../pages/shared/Unauthorized';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import CompanyDashboard from '../pages/company/Dashboard';
import CompanyProfile from '../pages/company/CompanyProfile';
import EditCompanyProfile from '../pages/company/EditCompanyProfile';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['company']} />}>
            <Route path="company/dashboard" element={<CompanyDashboard />} />
            <Route path="company/profile" element={<CompanyProfile />} />
            <Route path="company/profile/edit" element={<EditCompanyProfile />} />
          </Route>

          {/* Reserved for Student and Admin role-guarded branches
              added by future components. */}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
