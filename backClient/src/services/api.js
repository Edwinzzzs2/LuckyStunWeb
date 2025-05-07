// src/services/api.js
import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

// 配置 Axios 实例
const apiClient = axios.create({
  baseURL: '/api', // 假设所有 API 请求都以 /api 开头，需要根据实际后端配置调整
  timeout: 5000, // 请求超时时间
});

// 请求拦截器：在每个请求头中添加 Token
apiClient.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 401 未授权等情况
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // Token 无效或过期，清除 Token 并跳转到登录页
      removeToken();
      // 这里可以添加跳转逻辑，例如：
      // window.location.href = '/login';
      console.error('认证失败，请重新登录。');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// --- 认证相关 API ---
export const login = (credentials) => apiClient.post('/auth/login', credentials);
export const register = (userData) => apiClient.post('/auth/register', userData);
export const getMe = () => apiClient.get('/auth/me');

// --- 用户管理 API ---
export const getUsers = () => apiClient.get('/auth/users');
export const createUser = (userData) => apiClient.post('/auth/register', userData);
export const deleteUser = (id) => apiClient.post(`/auth/delete/${id}`);
export const updateUserPassword = (passwordData) => apiClient.post(`/auth/update-password`, passwordData);

// --- 分类管理 API ---
export const getCategoriesTree = () => apiClient.get('/categories');
export const getCategoriesFlat = () => apiClient.get('/categories/flat');
export const createCategory = (categoryData) => apiClient.post('/categories', categoryData);
export const updateCategory = (id, categoryData) => apiClient.post(`/categories/update/${id}`, categoryData);
export const deleteCategory = (id) => apiClient.post(`/categories/delete/${id}`);

// --- 网站管理 API ---
export const getSites = () => apiClient.get('/sites');
export const getSiteById = (id) => apiClient.get(`/sites/${id}`);
export const createSite = (siteData) => apiClient.post('/sites', siteData);
export const updateSite = (id, siteData) => apiClient.post(`/sites/update/${id}`, siteData);
export const deleteSite = (id) => apiClient.post(`/sites/delete/${id}`);
export const batchUpdateSiteCategory = (data) => apiClient.post('/sites/batch-update-category', data);

// --- 导航数据 API ---
export const getNavigationData = () => apiClient.get('/navigation');