// client/src/routes/AppRoutes.jsx

import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/common/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Home from '../pages/shared/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Unauthorized from '../pages/shared/Unauthorized';
import NotFound from '../pages/shared/NotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* Authenticated-only branch. Role-specific dashboards are added
            here as nested RoleRoute-guarded routes by future components. */}
        <Route element={<ProtectedRoute />}>
          {/* e.g. <Route element={<RoleRoute allowedRoles={['student']} />}>
                    <Route path="student/dashboard" element={<StudentDashboard />} />
                  </Route> */}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;