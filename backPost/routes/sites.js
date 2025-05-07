const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { URL } = require('url'); // 引入 URL 模块

// 获取所有网站列表
router.get('/', (req, res) => {
  const query = `
    SELECT s.*, c.name as category_name 
    FROM sites s
    LEFT JOIN categories c ON s.category_id = c.id
    ORDER BY s.created_at DESC, s.category_id ASC, s.sort_order ASC, s.id ASC;
  `;
  db.connection.query(query, (error, results) => {
    if (error) {
      console.error('获取网站列表失败:', error);
      return res.status(500).json({ message: '获取网站列表失败' });
    }
    res.json(results);
  });
});

// 获取单个网站详情
router.get('/:id', (req, res) => {
  const siteId = parseInt(req.params.id);
  if (isNaN(siteId)) {
    return res.status(400).json({ message: '无效的网站 ID' });
  }

  const query = `
    SELECT s.*, c.name as category_name 
    FROM sites s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE s.id = ?;
  `;
  db.connection.query(query, [siteId], (error, results) => {
    if (error) {
      console.error('获取网站详情失败:', error);
      return res.status(500).json({ message: '获取网站详情失败' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: '未找到指定网站' });
    }
    res.json(results[0]);
  });
});

// 创建新网站
router.post('/', authenticateAdmin, (req, res) => {
  const { 
    category_id, 
    url, 
    logo, 
    title, 
    desc, 
    sort_order = 0, 
    update_port_enabled = true 
  } = req.body;

  // 验证必填字段
  if (!category_id || !url || !title) {
    return res.status(400).json({ message: '分类、URL和标题为必填项' });
  }

  const query = `
    INSERT INTO sites (
      category_id, 
      url, 
      logo, 
      title, 
      \`desc\`, 
      sort_order, 
      created_at, 
      update_port_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
  `;
  db.connection.query(
    query, 
    [category_id, url, logo, title, desc, sort_order, update_port_enabled], 
    (error, results) => {
      if (error) {
        console.error('创建网站失败:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ message: '指定的分类不存在' });
        }
        return res.status(500).json({ message: '创建网站失败' });
      }
      res.status(201).json({
        id: results.insertId,
        category_id,
        url,
        logo,
        title,
        desc,
        sort_order,
        update_port_enabled,
        created_at: new Date().toISOString()
      });
    }
  );
});

// 更新网站
router.post('/update/:id', authenticateAdmin, (req, res) => {
  const siteId = parseInt(req.params.id);
  const { 
    category_id, 
    url, 
    logo, 
    title, 
    desc, 
    sort_order, 
    update_port_enabled = true 
  } = req.body;

  if (isNaN(siteId)) {
    return res.status(400).json({ message: '无效的网站 ID' });
  }

  // 验证必填字段
  if (!category_id || !url || !title) {
    return res.status(400).json({ message: '分类、URL和标题为必填项' });
  }

  const query = `
    UPDATE sites 
    SET 
      category_id = ?, 
      url = ?, 
      logo = ?, 
      title = ?, 
      \`desc\` = ?, 
      sort_order = ?, 
      update_port_enabled = ?
    WHERE id = ?
  `;
  db.connection.query(
    query, 
    [category_id, url, logo, title, desc, sort_order, update_port_enabled, siteId], 
    (error, results) => {
      if (error) {
        console.error('更新网站失败:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ message: '指定的分类不存在' });
        }
        return res.status(500).json({ message: '更新网站失败' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: '未找到要更新的网站' });
      }
      res.json({ message: '网站更新成功' });
    }
  );
});

// 删除网站
router.post('/delete/:id', authenticateAdmin, (req, res) => {
  const siteId = parseInt(req.params.id);

  if (isNaN(siteId)) {
    return res.status(400).json({ message: '无效的网站 ID' });
  }

  const query = 'DELETE FROM sites WHERE id = ?';
  db.connection.query(query, [siteId], (error, results) => {
    if (error) {
      console.error('删除网站失败:', error);
      return res.status(500).json({ message: '删除网站失败' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '未找到要删除的网站' });
    }
    res.json({ message: '网站删除成功' });
  });
});

// 批量更新站点分类
router.post('/batch-update-category', authenticateAdmin, (req, res) => {
  const { site_ids, category_id } = req.body;

  if (!Array.isArray(site_ids) || site_ids.length === 0 || !category_id) {
    return res.status(400).json({ message: '站点ID列表和目标分类ID为必填项' });
  }

  // 验证目标分类是否存在
  const checkCategoryQuery = 'SELECT id FROM categories WHERE id = ?';
  db.connection.query(checkCategoryQuery, [category_id], (errorCheck, categories) => {
    if (errorCheck) {
      console.error('验证分类失败:', errorCheck);
      return res.status(500).json({ message: '验证分类失败' });
    }

    if (categories.length === 0) {
      return res.status(400).json({ message: '目标分类不存在' });
    }

    // 批量更新站点分类
    const updateQuery = 'UPDATE sites SET category_id = ? WHERE id IN (?)';
    db.connection.query(updateQuery, [category_id, site_ids], (error, results) => {
      if (error) {
        console.error('批量更新站点分类失败:', error);
        return res.status(500).json({ message: '批量更新站点分类失败' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: '未找到要更新的站点' });
      }

      res.json({ 
        message: '站点分类批量更新成功',
        affected_rows: results.affectedRows
      });
    });
  });
});

// 批量更新指定分类下网站的URL和Logo端口号
router.post('/update-ports', (req, res) => {
  const { port } = req.body;

  // 1. 参数验证
  if (typeof port !== 'number' || !Number.isInteger(port) || port < 0 || port > 65535) {
    return res.status(400).json({ code: 1, message: '无效的端口号，应为 0-65535 之间的整数' });
  }

  // 2. 查询需要更新的网站
  const selectQuery = `
    SELECT id, url, logo, category_id
    FROM sites
    WHERE update_port_enabled = TRUE;
  `;

  db.connection.query(selectQuery, (errorSelect, sitesToUpdate) => {
    if (errorSelect) {
      console.error('查询网站数据失败:', errorSelect);
      return res.status(500).json({ code: 1, message: '查询网站数据失败' });
    }

    if (sitesToUpdate.length === 0) {
      return res.status(404).json({ code: 1, message: '没有可更新端口的网站' });
    }

    const updatePromises = [];
    let updatedCount = 0;
    const failedUpdates = [];
    const categoriesUpdated = new Set();

    // 3. 遍历网站，准备更新操作
    sitesToUpdate.forEach(site => {
      let updatedUrl = site.url;
      let updatedLogo = site.logo;
      let needsUpdate = false;

      // 尝试更新 URL 端口
      if (site.url) {
        try {
          const urlObject = new URL(site.url);
          if (urlObject.port) {
            const oldPort = urlObject.port;
            const portPattern = `:${oldPort}`;
            const newPort = `:${port}`;
            
            updatedUrl = site.url.replace(portPattern, newPort);
            
            if (updatedUrl !== site.url) {
              needsUpdate = true;
              console.log(`站点 ${site.id}: URL 端口 ${oldPort} -> ${port}`);
            }
          } else {
             console.log(`站点 ${site.id}: URL "${site.url}" 没有明确的端口号可更新。`);
          }
        } catch (e) {
          console.warn(`站点 ${site.id}: 解析或更新 URL "${site.url}" 失败: ${e.message}`);
        }
      }

      // 尝试更新 Logo URL 端口
      if (site.logo && site.logo.startsWith('http')) {
         try {
            const logoUrlObject = new URL(site.logo);
            if (logoUrlObject.port) {
                const oldPort = logoUrlObject.port;
                // 直接操作字符串替换端口号
                const portPattern = `:${oldPort}`;
                const newPort = `:${port}`;
                
                // 使用字符串替换保持原 URL 其他特性不变
                updatedLogo = site.logo.replace(portPattern, newPort);
                
                if (updatedLogo !== site.logo) {
                    needsUpdate = true;
                    console.log(`站点 ${site.id}: Logo 端口 ${oldPort} -> ${port}`);
                }
            } else {
                console.log(`站点 ${site.id}: Logo URL "${site.logo}" 没有明确的端口号可更新。`);
            }
         } catch (e) {
           console.warn(`站点 ${site.id}: 解析或更新 Logo URL "${site.logo}" 失败: ${e.message}`);
         }
      }

      if (needsUpdate) {
        const updateQuery = `
          UPDATE sites
          SET url = ?, logo = ?
          WHERE id = ?;
        `;
        const promise = new Promise((resolve, reject) => {
          db.connection.query(updateQuery, [updatedUrl, updatedLogo, site.id], (errorUpdate, results) => {
            if (errorUpdate) {
              console.error(`更新网站 ID ${site.id} 失败:`, errorUpdate);
              reject({ id: site.id, error: errorUpdate });
            } else {
              categoriesUpdated.add(site.category_id);
              resolve({ id: site.id, affectedRows: results.affectedRows });
            }
          });
        });
        updatePromises.push(promise);
      }
    });

    if (updatePromises.length === 0) {
      return res.json({ 
        code: 0, 
        message: '根据指定条件，没有需要更新端口的网站 (URL/Logo 中可能未包含明确的端口号)。' 
      });
    }

    // 4. 执行所有更新操作
    Promise.allSettled(updatePromises)
      .then(results => {
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.affectedRows > 0) {
            updatedCount++;
          } else if (result.status === 'rejected') {
            failedUpdates.push(result.reason);
          } else if (result.status === 'fulfilled' && result.value.affectedRows === 0) {
             console.log(`站点 ${result.value.id} 更新影响行数为 0。`);
          }
        });

        // 5. 返回结果
        if (failedUpdates.length > 0) {
          res.status(500).json({
            code: 1,
            message: `尝试更新 ${updatePromises.length} 个网站，成功 ${updatedCount} 个，失败 ${failedUpdates.length} 个。`,
            failures: failedUpdates.map(f => ({ id: f.id, error: f.error.code || f.error.message }))
          });
        } else {
          res.json({ 
            code: 0, 
            message: `成功为 ${updatedCount} 个网站的 URL/Logo 更新端口号为 ${port}`,
            updated_categories: Array.from(categoriesUpdated)
          });
        }
      });
  });
});

module.exports = router;