const mysql = require('mysql');
const bcrypt = require('bcrypt');
const config = require('../config');

// 默认管理员凭据
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin'
};

// 连接数据库
const connection = mysql.createConnection(config.database);

connection.connect(async (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  
  console.log('数据库连接成功');
  
  try {
    // 检查是否已有管理员账户
    connection.query('SELECT COUNT(*) as count FROM users WHERE is_admin = TRUE', async (error, results) => {
      if (error) {
        console.error('查询失败:', error);
        connection.end();
        process.exit(1);
      }
      
      if (results[0].count > 0) {
        console.log('已存在管理员账户，无需创建');
        connection.end();
        process.exit(0);
      }
      
      // 创建管理员账户
      console.log('正在创建初始管理员账户...');
      
      // 哈希密码
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);
      
      // 插入管理员账户
      const insertQuery = 'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, TRUE)';
      connection.query(insertQuery, [DEFAULT_ADMIN.username, passwordHash], (insertError, insertResults) => {
        if (insertError) {
          console.error('创建管理员失败:', insertError);
          connection.end();
          process.exit(1);
        }
        
        console.log(`已创建初始管理员账户`);
        console.log(`用户名: ${DEFAULT_ADMIN.username}`);
        console.log(`密码: ${DEFAULT_ADMIN.password}`);
        console.log('请立即登录并修改默认密码！');
        
        connection.end();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('创建管理员过程中发生错误:', error);
    connection.end();
    process.exit(1);
  }
}); 