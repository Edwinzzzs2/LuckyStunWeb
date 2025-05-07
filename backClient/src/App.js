import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // 引入 Ant Design 中文语言包
import AppRoutes from './routes';
import './App.css'; // 可以包含 App 级别的样式

function App() {
  return (
    <ConfigProvider locale={zhCN}> {/* 设置 Ant Design 全局语言为中文 */}
      <Router>
        <AppRoutes />
      </Router>
    </ConfigProvider>
  );
}

export default App;