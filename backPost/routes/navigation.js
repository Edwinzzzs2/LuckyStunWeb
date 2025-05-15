const express = require('express');
const router = express.Router();
const db = require('../db');
const { URL } = require('url'); // 引入 URL 模块

// 获取前端导航页的汇总数据
router.get('/', (req, res) => {
  // 获取URL类型参数，默认为'main'
  const urlType = req.query.url_type || 'main'; // 可能的值: main, backup, internal
  
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
        
        // 根据url_type参数选择返回的URL
        let displayUrl = site.url; // 默认使用主URL
        if (urlType === 'backup' && site.backup_url) {
          displayUrl = site.backup_url;
        } else if (urlType === 'internal' && site.internal_url) {
          displayUrl = site.internal_url;
        }
        
        sitesByCategory[site.category_id].push({
          url: displayUrl, // 只返回指定类型的URL
          logo: site.logo,
          title: site.title,
          desc: site.desc
        });
      });

      // 对每个分类下的站点按照 sort_order 排序
      Object.keys(sitesByCategory).forEach(categoryId => {
        sitesByCategory[categoryId].sort((a, b) => {
          const siteA = sites.find(s => s.url === a.url || s.backup_url === a.url || s.internal_url === a.url);
          const siteB = sites.find(s => s.url === b.url || s.backup_url === b.url || s.internal_url === b.url);
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
          sort_order: category.sort_order,
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
          sort_order: topLevelCategory.sort_order,
        };
        if (topLevelCategory.children.length > 0) {
          // 对子分类按sort_order排序
          topLevelCategory.children.sort((a, b) => {
            const aCategory = categoryMap[a.id];
            const bCategory = categoryMap[b.id];
            return (aCategory?.sort_order || 0) - (bCategory?.sort_order || 0);
          });
          
          finalCategory.children = topLevelCategory.children.map(child => ({
            name: child.name,
            en_name: child.en_name,
            sort_order: categoryMap[child.id]?.sort_order,
            web: child.web
          }));
        } else {
          finalCategory.web = topLevelCategory.web;
        }
        navigationData.push(finalCategory);
      });

      // 添加调试日志
      console.log("排序前:", navigationData.map(item => ({ name: item.name, sort: item.sort_order })));
      
      // 对最终结果按sort_order排序
      navigationData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      // 再次添加日志
      console.log("排序后:", navigationData.map(item => ({ name: item.name, sort: item.sort_order })));
      
      // 移除sort_order字段（如果不想返回给前端）
      // navigationData.forEach(item => {
      //   delete item.sort_order;
      //   if (item.children) {
      //     item.children.forEach(child => delete child.sort_order);
      //   }
      // });

      res.json(navigationData);
    });
  });
});

// 删除 update-ports 路由部分
module.exports = router;