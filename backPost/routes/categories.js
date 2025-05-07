const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// 获取所有分类（层级结构）
router.get('/', (req, res) => {
  const query = `
    SELECT id, name, en_name, icon, parent_id, sort_order
    FROM categories
    ORDER BY parent_id ASC, sort_order ASC, id ASC;
  `;
  db.connection.query(query, (error, results) => {
    if (error) {
      console.error('获取分类列表失败:', error);
      return res.status(500).json({ message: '获取分类列表失败' });
    }

    // 构建层级结构
    const categoryMap = {};
    const categoryTree = [];

    results.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    results.forEach(category => {
      if (category.parent_id && categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(categoryMap[category.id]);
      } else if (!category.parent_id) {
        categoryTree.push(categoryMap[category.id]);
      }
    });

    res.json(categoryTree);
  });
});

// 获取所有分类（扁平结构，用于下拉选择）
router.get('/flat', (req, res) => {
  const query = `
    SELECT id, name, parent_id
    FROM categories
    ORDER BY parent_id ASC, sort_order ASC, id ASC;
  `;
  db.connection.query(query, (error, results) => {
    if (error) {
      console.error('获取扁平分类列表失败:', error);
      return res.status(500).json({ message: '获取扁平分类列表失败' });
    }
    // 可以选择添加层级前缀，例如 "一级 > 二级"
    const flatCategories = [];
    const categoryMap = {};
    results.forEach(cat => categoryMap[cat.id] = cat);

    function buildPrefix(catId, currentName) {
      const cat = categoryMap[catId];
      if (!cat) return currentName;
      const parentName = cat.parent_id ? buildPrefix(cat.parent_id, categoryMap[cat.parent_id]?.name || '') : '';
      return parentName ? `${parentName} > ${currentName}` : currentName;
    }

    results.forEach(cat => {
      flatCategories.push({
        id: cat.id,
        // name: buildPrefix(cat.id, cat.name) // 如果需要层级前缀
        name: cat.name // 或者只返回原始名称
      });
    });

    res.json(flatCategories);
  });
});

// 创建新分类
router.post('/', authenticateAdmin, (req, res) => {
  const { name, en_name, icon, parent_id, sort_order = 0 } = req.body;

  if (!name) {
    return res.status(400).json({ message: '分类名称不能为空' });
  }

  // parent_id 为 null 或 0 时表示顶级分类
  const parentIdValue = (parent_id && parent_id !== '0' && parent_id !== '') ? parseInt(parent_id) : null;

  const query = 'INSERT INTO categories (name, en_name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)';
  db.connection.query(query, [name, en_name, icon, parentIdValue, sort_order], (error, results) => {
    if (error) {
      console.error('创建分类失败:', error);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: '指定的父分类不存在' });
      }
      return res.status(500).json({ message: '创建分类失败' });
    }
    res.status(201).json({ id: results.insertId, name, en_name, icon, parent_id: parentIdValue, sort_order });
  });
});

// 更新分类
router.post('/update/:id', authenticateAdmin, (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { name, en_name, icon, parent_id, sort_order } = req.body;

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: '无效的分类 ID' });
  }
  if (!name) {
    return res.status(400).json({ message: '分类名称不能为空' });
  }

  // parent_id 为 null 或 0 时表示顶级分类
  const parentIdValue = (parent_id && parent_id !== '0' && parent_id !== '') ? parseInt(parent_id) : null;

  if (parentIdValue === categoryId) {
    return res.status(400).json({ message: '不能将分类的父级设置为自身' });
  }

  const query = 'UPDATE categories SET name = ?, en_name = ?, icon = ?, parent_id = ?, sort_order = ? WHERE id = ?';
  db.connection.query(query, [name, en_name, icon, parentIdValue, sort_order, categoryId], (error, results) => {
    if (error) {
      console.error('更新分类失败:', error);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: '指定的父分类不存在' });
      }
      return res.status(500).json({ message: '更新分类失败' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '未找到要更新的分类' });
    }
    res.json({ message: '分类更新成功' });
  });
});

// 删除分类
router.post('/delete/:id', authenticateAdmin, (req, res) => {
  const categoryId = parseInt(req.params.id);

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: '无效的分类 ID' });
  }

  // 检查是否有子分类
  const checkChildrenQuery = 'SELECT id FROM categories WHERE parent_id = ? LIMIT 1';
  db.connection.query(checkChildrenQuery, [categoryId], (errorCheck, children) => {
    if (errorCheck) {
      console.error('检查子分类失败:', errorCheck);
      return res.status(500).json({ message: '删除分类前检查子分类失败' });
    }

    if (children.length > 0) {
      return res.status(400).json({ message: '无法删除，请先删除或移动该分类下的子分类' });
    }

    // 检查是否有网站关联
    const checkSitesQuery = 'SELECT id FROM sites WHERE category_id = ? LIMIT 1';
    db.connection.query(checkSitesQuery, [categoryId], (errorCheckSites, sites) => {
      if (errorCheckSites) {
        console.error('检查关联网站失败:', errorCheckSites);
        return res.status(500).json({ message: '删除分类前检查关联网站失败' });
      }

      if (sites.length > 0) {
        return res.status(400).json({ message: '无法删除，请先解除该分类下网站的关联' });
      }

      // 执行删除
      const deleteQuery = 'DELETE FROM categories WHERE id = ?';
      db.connection.query(deleteQuery, [categoryId], (errorDelete, results) => {
        if (errorDelete) {
          console.error('删除分类失败:', errorDelete);
          return res.status(500).json({ message: '删除分类失败' });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: '未找到要删除的分类' });
        }
        res.json({ message: '分类删除成功' });
      });
    });
  });
});

module.exports = router; 