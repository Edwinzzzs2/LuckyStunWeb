const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateAdmin } = require("../middleware/auth");
const { URL } = require("url"); // 引入 URL 模块

// 获取所有网站列表
router.get("/", async (req, res) => {
  try {
    const query = `SELECT id, category_id, url, backup_url, internal_url, logo, title, \`desc\`, sort_order, is_visible FROM sites`;
    const results = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error("获取网站列表失败:", error);
    res.status(500).json({ message: "获取网站列表失败" });
  }
});

// 获取单个网站详情
router.get("/:id", async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    if (isNaN(siteId)) {
      return res.status(400).json({ message: "无效的网站 ID" });
    }

    const query = `
      SELECT s.*, c.name as category_name 
      FROM sites s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?;
    `;
    const results = await db.query(query, [siteId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "未找到指定网站" });
    }
    res.json(results[0]);
  } catch (error) {
    console.error("获取网站详情失败:", error);
    res.status(500).json({ message: "获取网站详情失败" });
  }
});

// 添加新网站
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const {
      category_id,
      url,
      backup_url,
      internal_url,
      logo,
      title,
      desc,
      sort_order,
      is_visible,
    } = req.body;

    // 验证必填字段
    if (!category_id || !url || !title) {
      return res.status(400).json({ message: "请提供必要的网站信息" });
    }

    // 验证URL格式
    try {
      new URL(url);
      if (backup_url) new URL(backup_url);
      if (internal_url) new URL(internal_url);
    } catch (e) {
      return res.status(400).json({ message: "URL格式不正确" });
    }

    const query = `
      INSERT INTO sites (category_id, url, backup_url, internal_url, logo, title, \`desc\`, sort_order, is_visible)
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
      is_visible, // 默认为显示状态
    ]);

    res.status(201).json({
      id: result.insertId,
      message: "网站添加成功",
    });
  } catch (error) {
    console.error("添加网站失败:", error);
    res.status(500).json({ message: "添加网站失败" });
  }
});

// 更新网站信息
router.post("/:id(\\d+)", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      url,
      backup_url,
      internal_url,
      logo,
      title,
      desc,
      sort_order,
      is_visible,
    } = req.body;

    // 验证必填字段
    if (!category_id || !url || !title) {
      return res.status(400).json({ message: "请提供必要的网站信息" });
    }

    // 验证URL格式
    try {
      new URL(url);
      if (backup_url) new URL(backup_url);
      if (internal_url) new URL(internal_url);
    } catch (e) {
      return res.status(400).json({ message: "URL格式不正确" });
    }

    const query = `
      UPDATE sites 
      SET category_id = ?, url = ?, backup_url = ?, internal_url = ?, logo = ?, title = ?, \`desc\` = ?, sort_order = ?, is_visible = ?
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
      is_visible,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "未找到要更新的网站" });
    }

    res.json({ message: "网站更新成功" });
  } catch (error) {
    console.error("更新网站失败:", error);
    res.status(500).json({ message: "更新网站失败" });
  }
});

// 添加 POST 方法支持
router.post("/update/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      url,
      backup_url,
      internal_url,
      logo,
      title,
      desc,
      sort_order,
      is_visible,
    } = req.body;

    // 验证必填字段
    if (!category_id || !url || !title) {
      return res.status(400).json({ message: "请提供必要的网站信息" });
    }

    // 验证URL格式
    try {
      new URL(url);
      if (backup_url) new URL(backup_url);
      if (internal_url) new URL(internal_url);
    } catch (e) {
      return res.status(400).json({ message: "URL格式不正确" });
    }

    const query = `
      UPDATE sites 
      SET category_id = ?, url = ?, backup_url = ?, internal_url = ?, logo = ?, title = ?, \`desc\` = ?, sort_order = ?, is_visible = ?
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
      is_visible,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "未找到要更新的网站" });
    }

    res.json({ message: "网站更新成功" });
  } catch (error) {
    console.error("更新网站失败:", error);
    res.status(500).json({ message: "更新网站失败" });
  }
});

// 删除网站
router.post("/delete/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM sites WHERE id = ?", [id]);
    res.json({ message: "网站删除成功" });
  } catch (error) {
    console.error("删除网站失败:", error);
    res.status(500).json({ message: "删除网站失败" });
  }
});

// 批量更新站点分类
router.post("/batch-update-category", authenticateAdmin, async (req, res) => {
  try {
    const { site_ids, category_id, is_visible } = req.body;

    if (!Array.isArray(site_ids) || site_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "站点ID列表为必填项" });
    }

    // 构建更新查询
    let updateFields = [];
    let updateValues = [];

    // 如果提供了category_id参数，验证并添加到更新字段
    if (category_id !== undefined && category_id !== null) {
      // 验证目标分类是否存在
      const checkCategoryQuery = "SELECT id FROM categories WHERE id = ?";
      const categories = await db.query(checkCategoryQuery, [category_id]);

      if (categories.length === 0) {
        return res.status(400).json({ message: "目标分类不存在" });
      }

      updateFields.push("category_id = ?");
      updateValues.push(category_id);
    }

    // 如果提供了is_visible参数，添加到更新字段
    if (is_visible !== undefined) {
      updateFields.push("is_visible = ?");
      updateValues.push(is_visible);
    }

    // 检查是否有字段需要更新
    if (updateFields.length === 0) {
      return res.status(400).json({ message: "至少需要提供一个更新字段" });
    }

    // 构建并执行更新查询
    const updateQuery = `UPDATE sites SET ${updateFields.join(
      ", "
    )} WHERE id IN (?)`;
    const result = await db.query(updateQuery, [...updateValues, site_ids]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "未找到要更新的站点" });
    }

    const message = category_id !== undefined && category_id !== null 
      ? "批量更新站点分类成功" 
      : "批量更新站点状态成功";
    res.json({ message });
  } catch (error) {
    console.error("批量更新站点失败:", error);
    res.status(500).json({ message: "批量更新站点失败" });
  }
});

// webhook更新指定域名的端口号，包括主副网址和icon
router.post("/update-ports", async (req, res) => {
  try {
    const { port, domains, ids } = req.body;

    // 1. 参数验证
    // port 可以是数字或 null，null 表示去除端口号
    if (
      port !== null &&
      (!Number.isInteger(Number(port)) ||
        Number(port) < 0 ||
        Number(port) > 65535)
    ) {
      return res
        .status(400)
        .json({
          code: 1,
          message: "端口号应为 0-65535 之间的整数或 null（去除端口号）",
        });
    }

    if (!Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ code: 1, message: "域名数组为必填项" });
    }

    // 验证域名格式
    const domainPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    for (const domain of domains) {
      if (!domainPattern.test(domain)) {
        return res
          .status(400)
          .json({ code: 1, message: `无效的域名格式: ${domain}` });
      }
    }

    // 验证ID格式（如果提供了ID）
    if (ids && ids.length > 0) {
      for (const id of ids) {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
          return res
            .status(400)
            .json({ code: 1, message: `无效的站点ID: ${id}` });
        }
      }
    }

    // 2. 查询所有站点，让shouldUpdateSite函数来处理过滤
    const selectQuery = `
      SELECT id, url, backup_url, logo, category_id
      FROM sites`;

    const sitesToUpdate = await db.query(selectQuery);

    if (sitesToUpdate.length === 0) {
      return res
        .status(404)
        .json({ code: 1, message: "没有找到符合条件的网站" });
    }

    // 3. 辅助函数：检查域名是否匹配
    const isDomainMatch = (url, targetDomains) => {
      if (!url) return false;
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        return targetDomains.some(
          (domain) => hostname === domain || hostname.endsWith("." + domain)
        );
      } catch (error) {
        return false;
      }
    };

    // 4. 辅助函数：更新URL的端口号
    const updateUrlPort = (url, newPort) => {
      if (!url) return url;
      try {
        const urlObj = new URL(url);
        if (newPort === null) {
          // 去除端口号
          urlObj.port = "";
        } else {
          // 设置新端口号
          urlObj.port = newPort;
        }
        return urlObj.toString();
      } catch (error) {
        console.error("URL解析错误:", error);
        return url; // 返回原URL
      }
    };

    // 5. 辅助函数：判断站点是否应该被更新
    const shouldUpdateSite = (site) => {
      const hasIds = ids && ids.length > 0;
      const hasDomains = domains && domains.length > 0;

      if (!hasIds && !hasDomains) {
        return false; // 没有任何过滤条件
      }

      // 检查ID匹配
      const idMatched = hasIds ? ids.includes(site.id) : true;

      // 检查域名匹配（检查主URL、备用URL和Logo URL，不包括内网地址）
      const domainMatched = hasDomains
        ? isDomainMatch(site.url, domains) ||
          isDomainMatch(site.backup_url, domains) ||
          isDomainMatch(site.logo, domains)
        : true;

      // 当同时提供ID和域名时，两个条件都必须满足
      return idMatched && domainMatched;
    };

    // 6. 过滤需要更新的站点
    const filteredSites = sitesToUpdate.filter(shouldUpdateSite);

    if (filteredSites.length === 0) {
      return res.json({
        code: 0,
        message: "没有找到匹配的站点需要更新",
        matched_sites: [],
      });
    }

    // 7. 批量更新站点
    let updatedCount = 0;
    const failedUpdates = [];
    const categoriesUpdated = new Set();
    const matchedSites = [];

    for (const site of filteredSites) {
      const updates = [];
      const params = [];
      let hasChanges = false;

      // 更新主URL端口
      if (site.url && isDomainMatch(site.url, domains)) {
        const newUrl = updateUrlPort(site.url, port);
        if (newUrl !== site.url) {
          updates.push(`url = ?`);
          params.push(newUrl);
          hasChanges = true;
        }
      }

      // 更新备用URL端口
      if (site.backup_url && isDomainMatch(site.backup_url, domains)) {
        const newBackupUrl = updateUrlPort(site.backup_url, port);
        if (newBackupUrl !== site.backup_url) {
          updates.push(`backup_url = ?`);
          params.push(newBackupUrl);
          hasChanges = true;
        }
      }

      // 更新Logo URL端口
      if (site.logo && isDomainMatch(site.logo, domains)) {
        const newLogo = updateUrlPort(site.logo, port);
        if (newLogo !== site.logo) {
          updates.push(`logo = ?`);
          params.push(newLogo);
          hasChanges = true;
        }
      }

      // 记录匹配的站点信息
      matchedSites.push({
        id: site.id,
        url: site.url,
        backup_url: site.backup_url,
        logo: site.logo,
        needsUpdate: hasChanges,
        changes: updates,
      });

      // 如果有需要更新的字段，执行更新
      if (hasChanges) {
        try {
          params.push(site.id);

          const updateQuery = `
            UPDATE sites 
            SET ${updates.join(", ")}
            WHERE id = ?`;

          await db.query(updateQuery, params);
          updatedCount++;
          categoriesUpdated.add(site.category_id);
        } catch (errorUpdate) {
          failedUpdates.push({
            id: site.id,
            error: errorUpdate.code || errorUpdate.message,
          });
        }
      }
    }

    // 构建响应消息
    let matchCriteria = [];
    if (domains.length > 0) {
      matchCriteria.push(`域名 [${domains.join(", ")}]`);
    }
    if (ids && ids.length > 0) {
      matchCriteria.push(`ID [${ids.join(", ")}]`);
    }

    const portMessage = port === null ? "去除端口号" : `端口号为 ${port}`;

    if (failedUpdates.length > 0) {
      return res.status(500).json({
        code: 1,
        message: `通过 ${matchCriteria.join(" 和 ")} 匹配到 ${
          matchedSites.length
        } 个网站，尝试更新其中 ${
          matchedSites.filter((s) => s.needsUpdate).length
        } 个，成功 ${updatedCount} 个，失败 ${failedUpdates.length} 个。`,
        matched_sites: matchedSites,
        failures: failedUpdates.map((f) => ({
          id: f.id,
          error: f.error.code || f.error.message,
        })),
      });
    } else {
      return res.json({
        code: 0,
        message: `通过 ${matchCriteria.join(" 和 ")} 匹配到 ${
          matchedSites.length
        } 个网站，成功为其中 ${updatedCount} 个网站${portMessage}`,
        matched_sites: matchedSites,
        updated_categories: Array.from(categoriesUpdated),
      });
    }
  } catch (error) {
    console.error("批量更新端口失败:", error);
    res.status(500).json({ code: 1, message: "批量更新端口失败" });
  }
});

module.exports = router;
