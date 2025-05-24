const bcrypt = require('bcrypt');
const db = require('../db');

// 设置要更新的管理员用户名和新密码
const ADMIN_USERNAME = 'admin';
const NEW_PASSWORD = 'password'; // 修改为您想要的新密码

async function updateAdminPassword() {
  try {
    // 检查管理员账户是否存在
    const results = await db.query('SELECT id FROM users WHERE username = ?', [ADMIN_USERNAME]);
    
    if (results.length === 0) {
      console.error(`管理员账户 "${ADMIN_USERNAME}" 不存在`);
      process.exit(1);
    }
    
    const adminId = results[0].id;
    
    console.log(`正在更新管理员 "${ADMIN_USERNAME}" 的密码...`);
    
    // 哈希新密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
    
    // 更新管理员密码
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, adminId]);
    
    console.log('管理员密码更新成功！');
    console.log(`用户名: ${ADMIN_USERNAME}`);
    console.log(`新密码: ${NEW_PASSWORD}`);
  } catch (error) {
    console.error('更新密码失败:', error);
    process.exit(1);
  }
}

// 执行更新密码
updateAdminPassword().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('更新密码失败:', error);
  process.exit(1);
}); 