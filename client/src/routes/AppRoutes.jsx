import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/common/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleRoute from '../components/common/RoleRoute';

import Home from '../pages/shared/Home';
import NotFound from '../pages/shared/NotFound';
import Unauthorized from '../pages/shared/Unauthorized';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Component 10 — public internship browse/search/detail pages.
import BrowseInternships from '../components/student/BrowseInternships';
import InternshipDetails from '../components/student/InternshipDetails';

import CompanyDashboard from '../pages/company/Dashboard';
import CompanyProfile from '../pages/company/CompanyProfile';
import EditCompanyProfile from '../pages/company/EditCompanyProfile';

import ManagePostings from '../pages/company/ManagePostings';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* Component 10 — public internship browse/search/detail */}
        <Route path="internships" element={<BrowseInternships />} />
        <Route path="internships/:internshipId" element={<InternshipDetails />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['company']} />}>
            <Route path="company/dashboard" element={<CompanyDashboard />} />
            <Route path="company/profile" element={<CompanyProfile />} />
            <Route path="company/profile/edit" element={<EditCompanyProfile />} />
            <Route path="company/postings" element={<ManagePostings />} />
          </Route>

          {/* Reserved for future components: student/* and admin/* role-guarded branches */}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
