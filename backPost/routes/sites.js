const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { URL } = require('url'); // 引入 URL 模块

// 获取所有网站列表
router.get('/', async (req, res) => {
  try {
    const query = `SELECT id, category_id, url, backup_url, internal_url, logo, title, \`desc\`, sort_order, update_port_enabled FROM sites`;
    const results = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error('获取网站列表失败:', error);
    res.status(500).json({ message: '获取网站列表失败' });
  }
});

// 获取单个网站详情
router.get('/:id', async (req, res) => {
  try {
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
    const results = await db.query(query, [siteId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: '未找到指定网站' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('获取网站详情失败:', error);
    res.status(500).json({ message: '获取网站详情失败' });
  }
});

// 添加新网站
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { category_id, url, backup_url, internal_url, logo, title, desc, sort_order, update_port_enabled } = req.body;

    // 验证必填字段
    if (!category_id || !url || !title) {
      return res.status(400).json({ message: '请提供必要的网站信息' });
    }

    // 验证URL格式
    try {
      new URL(url);
      if (backup_url) new URL(backup_url);
      if (internal_url) new URL(internal_url);
    } catch (e) {
      return res.status(400).json({ message: 'URL格式不正确' });
    }

    const query = `
      INSERT INTO sites (category_id, url, backup_url, internal_url, logo, title, \`desc\`, sort_order, update_port_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(query, [
      category_id,
      url,
      backup_url || null,
      internal_url || null,
      logo || null,
      title,
      desc || null,
      sort_order || 0,
      update_port_enabled !== undefined ? update_port_enabled : true
    ]);

    res.status(201).json({
      id: result.insertId,
      message: '网站添加成功'
    });
  } catch (error) {
    console.error('添加网站失败:', error);
    res.status(500).json({ message: '添加网站失败' });
  }
});

// 更新网站信息
router.post('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, url, backup_url, internal_url, logo, title, desc, sort_order, update_port_enabled } = req.body;

    // 验证必填字段
    if (!category_id || !url || !title) {
      return res.status(400).json({ message: '请提供必要的网站信息' });
    }

    // 验证URL格式
    try {
      new URL(url);
      if (backup_url) new URL(backup_url);
      if (internal_url) new URL(internal_url);
    } catch (e) {
      return res.status(400).json({ message: 'URL格式不正确' });
    }

    const query = `
      UPDATE sites 
      SET category_id = ?, url = ?, backup_url = ?, internal_url = ?, logo = ?, title = ?, \`desc\` = ?, sort_order = ?, update_port_enabled = ?
      WHERE id = ?
    `;

    const result = await db.query(query, [
      category_id,
      url,
      backup_url || null,
      internal_url || null,
      logo || null,
      title,
      desc || null,
      sort_order || 0,
      update_port_enabled !== undefined ? update_port_enabled : true,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '未找到要更新的网站' });
    }

    res.json({ message: '网站更新成功' });
  } catch (error) {
    console.error('更新网站失败:', error);
    res.status(500).json({ message: '更新网站失败' });
  }
});

// 添加 POST 方法支持
router.post('/update/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, url, backup_url, internal_url, logo, title, desc, sort_order, update_port_enabled } = req.body;

    // 验证必填字段
    if (!category_id || !url || !title) {
      return res.status(400).json({ message: '请提供必要的网站信息' });
    }

    // 验证URL格式
    try {
      new URL(url);
      if (backup_url) new URL(backup_url);
      if (internal_url) new URL(internal_url);
    } catch (e) {
      return res.status(400).json({ message: 'URL格式不正确' });
    }

    const query = `
      UPDATE sites 
      SET category_id = ?, url = ?, backup_url = ?, internal_url = ?, logo = ?, title = ?, \`desc\` = ?, sort_order = ?, update_port_enabled = ?
      WHERE id = ?
    `;

    const result = await db.query(query, [
      category_id,
      url,
      backup_url || null,
      internal_url || null,
      logo || null,
      title,
      desc || null,
      sort_order || 0,
      update_port_enabled !== undefined ? update_port_enabled : true,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '未找到要更新的网站' });
    }

    res.json({ message: '网站更新成功' });
  } catch (error) {
    console.error('更新网站失败:', error);
    res.status(500).json({ message: '更新网站失败' });
  }
});

// 删除网站
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM sites WHERE id = ?', [id]);
    res.json({ message: '网站删除成功' });
  } catch (error) {
    console.error('删除网站失败:', error);
    res.status(500).json({ message: '删除网站失败' });
  }
});

// 批量更新站点分类
router.post('/batch-update-category', authenticateAdmin, async (req, res) => {
  try {
    const { site_ids, category_id, port, update_port_enabled } = req.body;

    if (!Array.isArray(site_ids) || site_ids.length === 0 || !category_id) {
      return res.status(400).json({ message: '站点ID列表和目标分类ID为必填项' });
    }

    // 验证目标分类是否存在
    const checkCategoryQuery = 'SELECT id FROM categories WHERE id = ?';
    const categories = await db.query(checkCategoryQuery, [category_id]);

    if (categories.length === 0) {
      return res.status(400).json({ message: '目标分类不存在' });
    }

    // 构建更新查询
    let updateFields = ['category_id = ?'];
    let updateValues = [category_id];

    // 如果提供了update_port_enabled参数，添加到更新字段
    if (update_port_enabled !== undefined) {
      updateFields.push('update_port_enabled = ?');
      updateValues.push(update_port_enabled);
    }

    // 构建并执行更新查询
    const updateQuery = `UPDATE sites SET ${updateFields.join(', ')} WHERE id IN (?)`;
    const result = await db.query(updateQuery, [...updateValues, site_ids]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '未找到要更新的站点' });
    }

    // 如果提供了端口号，则更新端口
    if (port !== undefined) {
      // 验证端口号
      if (typeof port !== 'number' || !Number.isInteger(port) || port < 0 || port > 65535) {
        return res.status(400).json({ message: '无效的端口号，应为 0-65535 之间的整数' });
      }

      // 查询需要更新的网站
      const selectQuery = 'SELECT id, url, logo FROM sites WHERE id IN (?)';
      const sitesToUpdate = await db.query(selectQuery, [site_ids]);

      // 更新每个网站的URL
      for (const site of sitesToUpdate) {
        try {
          const url = new URL(site.url);
          url.port = port;
          const updateUrlQuery = 'UPDATE sites SET url = ? WHERE id = ?';
          await db.query(updateUrlQuery, [url.toString(), site.id]);
        } catch (error) {
          console.error(`更新网站 ${site.id} 的URL失败:`, error);
        }
      }
    }

    res.json({ message: '批量更新站点分类成功' });
  } catch (error) {
    console.error('批量更新站点分类失败:', error);
    res.status(500).json({ message: '批量更新站点分类失败' });
  }
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