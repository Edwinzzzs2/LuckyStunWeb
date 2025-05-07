const express = require('express');
const router = express.Router();

// 导入各个路由模块
const authRoutes = require('./auth');
const categoryRoutes = require('./categories');
const siteRoutes = require('./sites');
const navigationRoutes = require('./navigation');

// 使用各个路由
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/sites', siteRoutes);
router.use('/navigation', navigationRoutes);

module.exports = router; 