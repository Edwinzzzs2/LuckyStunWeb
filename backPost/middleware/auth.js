const jwt = require('jsonwebtoken');
const config = require('../config');

const JWT_SECRET = config.jwtSecret || 'your_very_strong_secret_key';

// 验证 Token 的中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // 如果没有 token，返回 401

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // 如果 token 无效或过期，返回 403
    req.user = user; // 将解码后的用户信息附加到请求对象
    next(); // 继续处理请求
  });
}

// 验证管理员权限的中间件
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: '需要登录' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}

// 组合中间件：验证 Token 并检查管理员权限
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    requireAdmin(req, res, next);
  });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  authenticateAdmin,
  JWT_SECRET
}; 