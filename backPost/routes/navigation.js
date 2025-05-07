const express = require('express');
const router = express.Router();
const db = require('../db');
const { URL } = require('url'); // 引入 URL 模块

// 获取前端导航页的汇总数据
router.get('/', (req, res) => {
  const categoriesQuery = `
    SELECT id, name, en_name, icon, parent_id
    FROM categories
    ORDER BY parent_id ASC, sort_order ASC, id ASC;
  `;
  const sitesQuery = `
    SELECT id, category_id, url, logo, title, \`desc\`, sort_order
    FROM sites
    ORDER BY category_id ASC, sort_order ASC, id ASC;
  `;

  db.connection.query(categoriesQuery, (errorCategories, categories) => {
    if (errorCategories) {
      console.error('获取分类数据失败:', errorCategories);
      return res.status(500).send('获取分类数据失败');
    }

    db.connection.query(sitesQuery, (errorSites, sites) => {
      if (errorSites) {
        console.error('获取网站数据失败:', errorSites);
        return res.status(500).send('获取网站数据失败');
      }

      // 数据结构化
      const sitesByCategory = {};
      sites.forEach(site => {
        if (!sitesByCategory[site.category_id]) {
          sitesByCategory[site.category_id] = [];
        }
        sitesByCategory[site.category_id].push({
          url: site.url,
          logo: site.logo,
          title: site.title,
          desc: site.desc
        });
      });

      // 对每个分类下的站点按照 sort_order 排序
      Object.keys(sitesByCategory).forEach(categoryId => {
        sitesByCategory[categoryId].sort((a, b) => {
          const siteA = sites.find(s => s.url === a.url);
          const siteB = sites.find(s => s.url === b.url);
          return (siteA?.sort_order || 0) - (siteB?.sort_order || 0);
        });
      });

      const categoryMap = {};
      const navigationData = [];
      const categoryTree = {};

      categories.forEach(category => {
        categoryMap[category.id] = {
          id: category.id,
          name: category.name,
          en_name: category.en_name,
          icon: category.icon,
          parent_id: category.parent_id,
          web: sitesByCategory[category.id] || [],
          children: []
        };
      });

      // 构建层级结构
      Object.values(categoryMap).forEach(category => {
        if (category.parent_id && categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push({
            id: category.id,
            name: category.name,
            en_name: category.en_name,
            web: category.web
          });
          category.web = [];
        } else if (!category.parent_id) {
          categoryTree[category.id] = category;
        }
      });

      // 转换成最终数组格式
      Object.values(categoryTree).forEach(topLevelCategory => {
        const finalCategory = {
          name: topLevelCategory.name,
          en_name: topLevelCategory.en_name,
          icon: topLevelCategory.icon,
        };
        if (topLevelCategory.children.length > 0) {
          finalCategory.children = topLevelCategory.children.map(child => ({
            name: child.name,
            en_name: child.en_name,
            web: child.web
          }));
        } else {
          finalCategory.web = topLevelCategory.web;
        }
        navigationData.push(finalCategory);
      });

      res.json(navigationData);
    });
  });
});

// 删除 update-ports 路由部分
module.exports = router;