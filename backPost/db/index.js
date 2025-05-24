const mysql = require('mysql');
const config = require('../config');

// 创建连接池
const pool = mysql.createPool({
  ...config.database,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 添加连接超时设置
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 60000,
  // 添加字符集设置
  charset: 'utf8mb4',
  // 添加时区设置
  timezone: '+08:00',
  // 添加SSL配置（如果配置中有）
  ...(config.database.ssl ? { ssl: config.database.ssl } : {})
});

// 监听连接池错误
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('数据库连接丢失');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('数据库连接数过多');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('数据库连接被拒绝');
  } else if (err.code === 'ETIMEDOUT') {
    console.error('数据库连接超时');
  }
});

// 添加连接池状态监控
setInterval(() => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('连接池状态检查失败:', err);
      return;
    }
    console.log('连接池状态:', {
      threadId: connection.threadId,
      state: connection.state,
      _allConnections: pool._allConnections.length,
      _freeConnections: pool._freeConnections.length,
      _connectionQueue: pool._connectionQueue.length
    });
    connection.release();
  });
}, 30000); // 每30秒检查一次

// 初始化函数，创建必要的表
async function init() {
  try {
    // 测试连接池
    await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('数据库连接失败:', err);
          return reject(err);
        }
        console.log('数据库连接池初始化成功');
        connection.release();
        resolve();
      });
    });

    await createTables();
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 创建数据表
async function createTables() {
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
        backup_url VARCHAR(2048),
        internal_url VARCHAR(2048),
        logo VARCHAR(2048),
        title VARCHAR(255) NOT NULL,
        \`desc\` TEXT,
        sort_order INT DEFAULT 0,
        update_port_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  const tables = [
    { name: 'users', query: createUsersTable },
    { name: 'categories', query: createCategoriesTable },
    { name: 'sites', query: createSitesTable }
  ];

  for (const table of tables) {
    try {
      await new Promise((resolve, reject) => {
        pool.query(table.query, (err) => {
          if (err) {
            console.error(`创建 ${table.name} 表失败:`, err);
            return reject(err);
          }
          console.log(`${table.name} 表检查/创建成功`);
          resolve();
        });
      });
    } catch (error) {
      console.error(`创建 ${table.name} 表时发生错误:`, error);
      throw error;
    }
  }
}

// 封装查询方法
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        console.error('SQL查询错误:', error);
        return reject(error);
      }
      resolve(results);
    });
  });
};

// 封装事务方法
const transaction = async (callback) => {
  const connection = await new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) {
        return reject(err);
      }
      resolve(conn);
    });
  });

  try {
    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const result = await callback(connection);

    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    return result;
  } catch (error) {
    await new Promise(resolve => {
      connection.rollback(() => {
        resolve();
      });
    });
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  init,
  pool,
  query,
  transaction
}; 