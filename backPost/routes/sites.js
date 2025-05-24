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
router.post('/:id(\\d+)', authenticateAdmin, async (req, res) => {
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
router.post('/delete/:id', authenticateAdmin, async (req, res) => {
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
          // 用正则替换端口，不用 new URL
          let updated = site.url;
          const portPattern = /^(https?:\/\/[^/:]+)(:\d+)?(\/?.*)$/i;
          const match = updated.match(portPattern);
          if (match) {
            const currentPort = match[2] ? parseInt(match[2].slice(1)) : (match[1].startsWith('https') ? 443 : 80);
            if (currentPort !== port) {
              updated = match[1] + (port ? `:${port}` : '') + (match[3] || '');
              const updateUrlQuery = 'UPDATE sites SET url = ? WHERE id = ?';
              await db.query(updateUrlQuery, [updated, site.id]);
            }
          }
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
router.post('/update-ports', async (req, res) => {
  console.log('update-ports')
  try {
    const port = Number(req.body.port);

    // 1. 参数验证
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      return res.status(400).json({ code: 1, message: '无效的端口号，应为 0-65535 之间的整数' });
    }

    // 2. 查询需要更新的网站
    const selectQuery = `
      SELECT id, url, logo, category_id
      FROM sites
      WHERE update_port_enabled = TRUE;
    `;
    const sitesToUpdate = await db.query(selectQuery);

    if (sitesToUpdate.length === 0) {
      return res.status(404).json({ code: 1, message: '没有可更新端口的网站' });
    }

    let updatedCount = 0;
    const failedUpdates = [];
    const categoriesUpdated = new Set();

    for (const site of sitesToUpdate) {
      let updatedUrl = site.url;
      let updatedLogo = site.logo;
      let needsUpdate = false;

      // 尝试更新 URL 端口（用正则，不用 new URL）
      if (site.url) {
        try {
          // 匹配协议://host:port/path 或协议://host/path
          let updated = site.url;
          const portPattern = /^(https?:\/\/[^/:]+)(:\d+)?(\/?.*)$/i;
          const match = updated.match(portPattern);
          if (match) {
            const currentPort = match[2] ? parseInt(match[2].slice(1)) : (match[1].startsWith('https') ? 443 : 80);
            if (currentPort !== port) {
              // 拼接新url
              updatedUrl = match[1] + (port ? `:${port}` : '') + (match[3] || '');
              needsUpdate = true;
            }
          }
        } catch (e) {
          console.warn(`站点 ${site.id}: 解析或更新 URL 失败: ${e.message}`);
        }
      }

      // 尝试更新 Logo URL 端口（用正则，不用 new URL）
      if (site.logo && site.logo.startsWith('http')) {
        try {
          let updated = site.logo;
          const portPattern = /^(https?:\/\/[^/:]+)(:\d+)?(\/?.*)$/i;
          const match = updated.match(portPattern);
          if (match) {
            const currentPort = match[2] ? parseInt(match[2].slice(1)) : (match[1].startsWith('https') ? 443 : 80);
            if (currentPort !== port) {
              updatedLogo = match[1] + (port ? `:${port}` : '') + (match[3] || '');
              needsUpdate = true;
            }
          }
        } catch (e) {
          console.warn(`站点 ${site.id}: 解析或更新 Logo URL 失败: ${e.message}`);
        }
      }

      if (needsUpdate) {
        try {
          await db.query('UPDATE sites SET url = ?, logo = ? WHERE id = ?', [updatedUrl, updatedLogo, site.id]);
          updatedCount++;
          categoriesUpdated.add(site.category_id);
        } catch (errorUpdate) {
          failedUpdates.push({ id: site.id, error: errorUpdate });
        }
      }
    }

    if (failedUpdates.length > 0) {
      return res.status(500).json({
        code: 1,
        message: `尝试更新 ${sitesToUpdate.length} 个网站，成功 ${updatedCount} 个，失败 ${failedUpdates.length} 个。`,
        failures: failedUpdates.map(f => ({ id: f.id, error: f.error.code || f.error.message }))
      });
    } else {
      return res.json({
        code: 0,
        message: `成功为 ${updatedCount} 个网站的 URL/Logo 更新端口号为 ${port}`,
        updated_categories: Array.from(categoriesUpdated)
      });
    }
  } catch (error) {
    console.error('批量更新端口失败:', error);
    res.status(500).json({ code: 1, message: '批量更新端口失败' });
  }
});

module.exports = router;