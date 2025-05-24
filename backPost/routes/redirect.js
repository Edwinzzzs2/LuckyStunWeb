const express = require('express');
const router = express.Router();
const db = require('../db');

// 重定向接口 - 根据站点ID获取URL信息
router.get('/', async (req, res) => {
  try {
    const siteId = parseInt(req.query.id);
    
    // 验证站点ID
    if (!siteId || isNaN(siteId)) {
      return res.status(400).json({ success: false, message: '无效的站点ID' });
    }

    // 查询站点信息
    const query = `
      SELECT id, url, backup_url, internal_url, logo, title, \`desc\` 
      FROM sites 
      WHERE id = ?
    `;
    
    const results = await db.query(query, [siteId]);
    
    if (results.length === 0) {
      // 返回200状态码，但标记为找不到站点
      return res.json({ 
        success: false, 
        not_found: true,
        message: '未找到ID为' + siteId + '的站点' 
      });
    }
    
    // 返回站点URL信息
    res.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    console.error('获取站点URL信息失败:', error);
    res.status(500).json({ success: false, message: '获取站点URL信息失败' });
  }
});

module.exports = router; 