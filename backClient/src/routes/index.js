import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import CategoryManagement from '../pages/CategoryManagement';
import SiteManagement from '../pages/SiteManagement';
import UserManagement from '../pages/UserManagement';
import NotFound from '../pages/NotFound'; // 可以创建一个404页面
import { isLoggedIn } from '../utils/auth';

// 私有路由组件，检查用户是否登录
const PrivateRoute = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* 需要登录才能访问的后台管理页面 */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        {/* AdminLayout 下的子路由 */}
        <Route index element={<Dashboard />} /> {/* 默认首页指向 Dashboard */}
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="sites" element={<SiteManagement />} />
        <Route path="user-management" element={<UserManagement />} />
      </Route>

      {/* 其他路由，例如 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 