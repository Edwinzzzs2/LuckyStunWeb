import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'authToken';
const USER_INFO_KEY = 'userInfo';
const LOGIN_PATH = '/';
const TOKEN_EXPIRY_WARNING = 15 * 60 * 1000; // 15分钟，提前预警时间（毫秒）
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  removeUserInfo();
};

export const isLoggedIn = () => {
  return !!getToken();
};

export const setUserInfo = (userInfo) => {
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  } else {
    removeUserInfo();
  }
};

export const getUserInfo = () => {
  const userInfoString = localStorage.getItem(USER_INFO_KEY);
  if (userInfoString) {
    try {
      return JSON.parse(userInfoString);
    } catch (e) {
      console.error("Error parsing user info from localStorage", e);
      removeUserInfo();
      return null;
    }
  }
  return null;
};

export const removeUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
};

export const setRefreshToken = (refreshToken) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    
    // 检查当前时间是否超过token的过期时间
    const currentTime = Date.now();
    const expiryTime = decoded.exp * 1000;
    
    // 检查token是否已过期
    if (currentTime >= expiryTime) {
      console.log('Token已过期');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('解析token失败:', error);
    return false;
  }
};


export const logout = (redirectUrl) => {
  removeToken();
  removeRefreshToken();
  removeUserInfo();
  
  // 重定向到根路径而不是登录路径
  if (window.location.pathname !== LOGIN_PATH) {
    // 如果有重定向参数，则添加到查询字符串
    if (redirectUrl) {
      window.location.href = `${LOGIN_PATH}?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      window.location.href = LOGIN_PATH;
    }
  }
};

export const checkAuthStatus = () => {
  if (!isLoggedIn()) {
    // 如果未登录且不在登录页，则重定向到根路径
    if (window.location.pathname !== LOGIN_PATH) {
      window.location.href = LOGIN_PATH;
    }
    return false;
  }
  
  if (!isTokenValid()) {
    console.log('Token无效或已过期，正在重定向到登录页面...');
    logout(window.location.pathname);
    return false;
  }
  
  return true;
};

// 添加一个自动检查token状态的函数，可以定期调用
export const setupTokenExpiryCheck = (intervalMinutes = 1) => {
  // 立即检查一次
  checkAuthStatus();
  
  // 设置定期检查
  const intervalId = setInterval(() => {
    if (!checkAuthStatus()) {
      // 如果检查失败，清除定时器
      clearInterval(intervalId);
    }
  }, intervalMinutes * 60 * 1000);
  
  // 返回interval ID方便清除
  return intervalId;
};


// 添加一个自动初始化功能，在脚本加载时执行
const initAuth = () => {
  // 确保只在浏览器环境中执行
  if (typeof window !== 'undefined') {
    try {
      // 立即检查token状态
      const isValid = checkAuthStatus();
      console.log('初始化时Token检查结果:', isValid ? '有效' : '无效或未登录');
      
      // 为DOMContentLoaded事件添加监听器，确保页面加载完成后检查
      document.addEventListener('DOMContentLoaded', () => {
        console.log('页面加载完成，检查Token状态');
        checkAuthStatus();
      });
      
      // 设置定期检查
      setupTokenExpiryCheck();
    } catch (error) {
      console.error('Auth初始化出错:', error);
    }
  }
};

// 立即执行初始化
initAuth(); 