const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authenticateAdmin, JWT_SECRET } = require('../middleware/auth');

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: '请提供用户名和密码' });
    }

    const query = 'SELECT id, username, password_hash, is_admin FROM users WHERE username = ?';
    const results = await db.query(query, [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 Token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        isAdmin: user.is_admin === 1
      }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;
    
    // 输入验证
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少为6个字符' });
    }

    // 检查用户名是否已存在
    const checkUserQuery = 'SELECT id FROM users WHERE username = ?';
    const checkResults = await db.query(checkUserQuery, [username]);
    
    if (checkResults.length > 0) {
      return res.status(409).json({ message: '用户名已存在' });
    }
    
    // 哈希密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 根据请求参数决定是否为管理员，默认为普通用户
    const userIsAdmin = isAdmin === true;
    
    // 插入新用户
    const insertQuery = 'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)';
    const insertResults = await db.query(insertQuery, [username, passwordHash, userIsAdmin]);
    
    res.status(201).json({ 
      message: '注册成功', 
      user: { 
        id: insertResults.insertId, 
        username: username,
        isAdmin: userIsAdmin
      } 
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 创建管理员账户（首次设置或超级管理员使用）
router.post('/create-admin', authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查当前用户是否已是管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '需要管理员权限' });
    }
    
    // 输入验证
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少为6个字符' });
    }

    // 检查用户名是否已存在
    const checkUserQuery = 'SELECT id FROM users WHERE username = ?';
    const checkResults = await db.query(checkUserQuery, [username]);
    
    if (checkResults.length > 0) {
      return res.status(409).json({ message: '用户名已存在' });
    }
    
    // 哈希密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 创建管理员用户
    const isAdmin = true;
    
    const insertQuery = 'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)';
    const insertResults = await db.query(insertQuery, [username, passwordHash, isAdmin]);
    
    res.status(201).json({ 
      message: '管理员创建成功', 
      user: { 
        id: insertResults.insertId, 
        username: username,
        isAdmin: true
      } 
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      isAdmin: req.user.isAdmin
    }
  });
});

// 获取所有用户信息（仅管理员可访问）
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // 检查当前用户是否是管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '需要管理员权限' });
    }
    
    // 查询所有用户
    const query = 'SELECT id, username, is_admin, created_at FROM users';
    const results = await db.query(query);
    
    // 格式化用户数据
    const users = results.map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin === 1,
      createdAt: user.created_at
    }));
    
    res.json({ users });
  } catch (error) {
    console.error('查询用户失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新/重置用户密码 - 仅限管理员操作
router.post('/update-password', authenticateAdmin, (req, res) => { // 使用 authenticateAdmin 确保只有管理员能调用
    const { newPassword, userId: targetUserIdFromBody } = req.body; // 管理员必须提供目标 userId 和 newPassword
    // const loggedInUserId = req.user.userId; // 当前管理员的 ID，可能用于日志或未来扩展

    // --- 输入验证 ---
    // 管理员必须指定要修改哪个用户
    if (targetUserIdFromBody === undefined || targetUserIdFromBody === null) {
        return res.status(400).json({ message: '必须提供目标用户 ID (userId)' });
    }
    const targetUserId = parseInt(targetUserIdFromBody);
    if (isNaN(targetUserId)) {
        return res.status(400).json({ message: '提供的用户 ID 无效' });
    }

    if (!newPassword) {
        return res.status(400).json({ message: '新密码不能为空' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: '新密码长度至少为6个字符' });
    }

    // --- 获取目标用户信息 (检查用户是否存在以及是否为 'admin') ---
    const getUserQuery = 'SELECT username FROM users WHERE id = ?';
    db.connection.query(getUserQuery, [targetUserId], async (error, results) => {
        if (error) {
            console.error('查询用户失败:', error);
            return res.status(500).json({ message: '服务器内部错误 (查询用户)' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: '目标用户不存在' });
        }

        const targetUser = results[0];

        // --- 权限检查：管理员不能修改 'admin' 用户的密码 ---
        if (targetUser.username === 'admin') {
             // 即使是其他管理员也不能修改名为 'admin' 的用户
             return res.status(403).json({ message: '不允许修改超级管理员(admin)的密码' });
        }

        // --- 哈希并更新密码 (不再需要验证当前密码) ---
        try {
            const saltRounds = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            const updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
            db.connection.query(updateQuery, [newPasswordHash, targetUserId], (updateError, updateResults) => {
                if (updateError) {
                    console.error('更新密码失败:', updateError);
                    return res.status(500).json({ message: '更新密码失败' });
                }
                if (updateResults.affectedRows === 0) {
                    // 理论上不应该发生
                    return res.status(404).json({ message: '目标用户不存在 (更新时)' });
                }
                // 返回明确的重置消息
                res.json({ message: `用户 ${targetUser.username} 的密码已重置` });
            });
        } catch (hashError) {
            console.error('密码哈希失败:', hashError);
            return res.status(500).json({ message: '服务器内部错误 (哈希密码)' });
        }
    });
});

// 删除用户 - 需要管理员权限
router.post('/delete/:id', authenticateAdmin, (req, res) => {
    const userIdToDelete = parseInt(req.params.id);
    const currentUserId = req.user.userId; // 从 token 获取当前登录用户的 ID

    if (isNaN(userIdToDelete)) {
        return res.status(400).json({ message: '无效的用户 ID' });
    }

    // 防止管理员删除自己
    if (userIdToDelete === currentUserId) {
        return res.status(400).json({ message: '不能删除自己的账户' });
    }

    // 执行删除
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    db.connection.query(deleteQuery, [userIdToDelete], (error, results) => {
        if (error) {
            console.error('删除用户失败:', error);
            return res.status(500).json({ message: '删除用户失败' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: '未找到要删除的用户' });
        }
        res.json({ message: '用户删除成功' });
    });
});

module.exports = router;