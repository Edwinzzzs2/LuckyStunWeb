const bcrypt = require('bcrypt');
const db = require('../db');

// 默认管理员凭据
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin'
};

async function createAdmin() {
  try {
    // 检查是否已有管理员账户
    const results = await db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = TRUE');
    
    if (results[0].count > 0) {
      console.log('已存在管理员账户，无需创建');
      return;
    }
    
    // 创建管理员账户
    console.log('正在创建初始管理员账户...');
    
    // 哈希密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);
    
    // 插入管理员账户
    const insertQuery = 'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, TRUE)';
    await db.query(insertQuery, [DEFAULT_ADMIN.username, passwordHash]);
    
    console.log(`已创建初始管理员账户`);
    console.log(`用户名: ${DEFAULT_ADMIN.username}`);
    console.log(`密码: ${DEFAULT_ADMIN.password}`);
    console.log('请立即登录并修改默认密码！');
  } catch (error) {
    console.error('创建管理员过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行创建管理员
createAdmin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('创建管理员失败:', error);
  process.exit(1);
}); 