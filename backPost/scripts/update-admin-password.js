const mysql = require('mysql');
const bcrypt = require('bcrypt');
const config = require('../config');

// 设置要更新的管理员用户名和新密码
const ADMIN_USERNAME = 'admin';
const NEW_PASSWORD = 'password'; // 修改为您想要的新密码

// 连接数据库
const connection = mysql.createConnection(config.database);

connection.connect(async (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  
  console.log('数据库连接成功');
  
  try {
    // 检查管理员账户是否存在
    connection.query('SELECT id FROM users WHERE username = ?', [ADMIN_USERNAME], async (error, results) => {
      if (error) {
        console.error('查询失败:', error);
        connection.end();
        process.exit(1);
      }
      
      if (results.length === 0) {
        console.error(`管理员账户 "${ADMIN_USERNAME}" 不存在`);
        connection.end();
        process.exit(1);
      }
      
      const adminId = results[0].id;
      
      console.log(`正在更新管理员 "${ADMIN_USERNAME}" 的密码...`);
      
      // 哈希新密码
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
      
      // 更新管理员密码
      const updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
      connection.query(updateQuery, [passwordHash, adminId], (updateError, updateResults) => {
        if (updateError) {
          console.error('更新密码失败:', updateError);
          connection.end();
          process.exit(1);
        }
        
        console.log('管理员密码更新成功！');
        console.log(`用户名: ${ADMIN_USERNAME}`);
        console.log(`新密码: ${NEW_PASSWORD}`);
        
        connection.end();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('更新密码过程中发生错误:', error);
    connection.end();
    process.exit(1);
  }
}); 