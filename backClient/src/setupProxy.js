const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // 代理所有以 /api 开头的请求
    createProxyMiddleware({
      target: 'http://localhost:3602', // 目标后端服务器地址
      changeOrigin: true, // 需要改变 Origin 请求头
      // 如果后端 API 路径本身不包含 /api，可以取消注释下面的代码
      // pathRewrite: {
      //   '^/api': '', // 移除请求路径中的 /api 前缀
      // },
    })
  );

  // 如果需要代理其他路径，可以在这里添加更多 app.use(...)
};