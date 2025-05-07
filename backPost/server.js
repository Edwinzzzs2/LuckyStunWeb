const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const routes = require('./routes');

// 创建 Express 应用实例
const app = express();
const port = config.server.port || 3000;

// 中间件设置
app.use(cors());
app.use(express.json());

// 路由设置
app.use('/api', routes);

// 启动服务器
db.init().then(() => {
  app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
  });
}).catch(err => {
  console.error('启动服务器失败:', err);
  process.exit(1);
});
