const express = require('express');
const router = express.Router();
const db = require('../db');
const { URL } = require('url'); // 引入 URL 模块

// 获取前端导航页的汇总数据
router.get('/', async (req, res) => {
  try {
    // 获取URL类型参数，默认为'main'
    const urlType = req.query.url_type || 'main';
    
    const categoriesQuery = `
      SELECT id, name, en_name, icon, parent_id, sort_order
      FROM categories
      ORDER BY parent_id ASC, sort_order ASC, id ASC;
    `;
    const sitesQuery = `
      SELECT id, category_id, url, backup_url, internal_url, logo, title, \`desc\`, sort_order
      FROM sites
      ORDER BY category_id ASC, sort_order ASC, id ASC;
    `;

    const [categories, sites] = await Promise.all([
      db.query(categoriesQuery),
      db.query(sitesQuery)
    ]);

    // 处理分类数据
    const categoryMap = new Map();
    const rootCategories = [];

    // 首先将所有分类放入 Map
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: []
      });
    });

    // 构建分类树
    categories.forEach(category => {
      if (category.parent_id === null) {
        rootCategories.push(categoryMap.get(category.id));
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      }
    });

    // 处理网站数据
    const siteMap = new Map();
    sites.forEach(site => {
      const categoryId = site.category_id;
      if (!siteMap.has(categoryId)) {
        siteMap.set(categoryId, []);
      }
      siteMap.get(categoryId).push(site);
    });

    // 将网站数据添加到对应的分类中
    const addSitesToCategories = (categories) => {
      categories.forEach(category => {
        category.web = siteMap.get(category.id) || [];
        if (category.children.length > 0) {
          addSitesToCategories(category.children);
        }
      });
    };

    addSitesToCategories(rootCategories);

    res.json(rootCategories);
  } catch (error) {
    console.error('获取导航数据失败:', error);
    res.status(500).json({ message: '获取导航数据失败' });
  }
});

// 删除 update-ports 路由部分
module.exports = router;