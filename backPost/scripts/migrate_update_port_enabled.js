const db = require('../db');
const path = require('path');
const fs = require('fs').promises;

async function runMigration() {
  try {
    // 读取 SQL 迁移脚本
    const migrationSqlPath = path.join(__dirname, '../migrations/20240624_add_update_port_enabled.sql');
    const migrationSql = await fs.readFile(migrationSqlPath, 'utf8');

    // 分割 SQL 语句
    const sqlStatements = migrationSql.split(';').filter(statement => statement.trim() !== '');

    // 逐条执行 SQL 语句
    for (const statement of sqlStatements) {
      await new Promise((resolve, reject) => {
        console.log(`执行 SQL: ${statement.trim()}`);
        db.connection.query(statement, (error, results) => {
          if (error) {
            console.error('执行 SQL 语句失败:', error);
            return reject(error);
          }
          console.log('SQL 语句执行成功');
          console.log('影响的行数:', results ? results.affectedRows : '未知');
          resolve();
        });
      });
    }

    console.log('数据库迁移全部完成！');
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    // 详细记录错误信息
    console.error('错误详情:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    throw error;
  }
}

// 立即执行迁移
runMigration()
  .then(() => {
    console.log('迁移成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  }); 