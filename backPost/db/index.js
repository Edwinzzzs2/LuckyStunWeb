const mysql = require('mysql');
const config = require('../config');

// 创建数据库连接
const connection = mysql.createConnection(config.database);

// 初始化函数，连接数据库并创建必要的表
function init() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('数据库连接失败:', err);
        return reject(err);
      }
      console.log('数据库连接成功');
      createTables()
        .then(resolve)
        .catch(reject);
    });
  });
}

// 创建数据表
function createTables() {
  return new Promise((resolve, reject) => {
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        en_name VARCHAR(255),
        icon VARCHAR(255),
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const createSitesTable = `
    CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        url VARCHAR(2048) NOT NULL,
        logo VARCHAR(2048),
        title VARCHAR(255) NOT NULL,
        \`desc\` TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    const tables = [
      { name: 'users', query: createUsersTable },
      { name: 'categories', query: createCategoriesTable },
      { name: 'sites', query: createSitesTable }
    ];

    const promises = tables.map(table => {
      return new Promise((resolveTable, rejectTable) => {
        connection.query(table.query, (err) => {
          if (err) {
            console.error(`创建 ${table.name} 表失败:`, err);
            return rejectTable(err);
          }
          console.log(`${table.name} 表检查/创建成功`);
          resolveTable();
        });
      });
    });

    Promise.all(promises)
      .then(resolve)
      .catch(reject);
  });
}

module.exports = {
  init,
  connection
}; 