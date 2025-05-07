import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, message, Typography } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { removeToken, isLoggedIn, getUserInfo, removeUserInfo } from '../utils/auth';
import './AdminLayout.css'; // 引入布局样式

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const AdminLayout = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const [currentUser, setCurrentUser] = useState(() => getUserInfo());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedUserInfo = getUserInfo();
    if (!isLoggedIn() || !storedUserInfo) {
      messageApi.open({ type: 'error', content: '请先登录。' });
      removeToken();
      removeUserInfo();
      navigate('/login');
    } else {
      if (JSON.stringify(storedUserInfo) !== JSON.stringify(currentUser)) {
        setCurrentUser(storedUserInfo);
      }
    }
  }, [navigate, location, currentUser, messageApi]);

  const handleLogout = () => {
    removeToken();
    messageApi.open({ type: 'success', content: '已退出登录' });
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/categories', icon: <AppstoreOutlined />, label: <Link to="/categories">分类管理</Link> },
    { key: '/sites', icon: <GlobalOutlined />, label: <Link to="/sites">网站管理</Link> },
  ];

  if (currentUser && currentUser.isAdmin) {
    menuItems.push({
      key: '/user-management',
      icon: <SettingOutlined />,
      label: <Link to="/user-management">后台管理</Link>
    });
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const selectedKeys = [location.pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sider trigger={null} collapsible collapsed={collapsed} width={220} theme="light">
        <div className="logo-container">
           {/* 可以放置 Logo 图片或文字 */}
           <Title level={4} style={{ color: '#1890ff', margin: '16px', textAlign: 'center' }}>WebStack</Title>
        </div>
        <div className="user-info-sidebar">
          <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: '8px' }}/>
          <div style={{ color: '#555', fontWeight: 'bold' }}>{currentUser?.username || '...loading'}</div>
          <div style={{ color: '#aaa', fontSize: '12px' }}>在线</div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={() => window.innerWidth <= 768 && setCollapsed(true)}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
          })}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{currentUser?.username || '...loading'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet /> {/* 子路由对应的页面组件会在这里渲染 */}
        </Content>
        <Footer style={{ textAlign: 'center', background: '#f0f2f5', padding: '10px 0' }}>
          Web Stack Admin ©{new Date().getFullYear()} Powered by React & Ant Design
          <span style={{ marginLeft: '10px', color: '#aaa' }}>Env: local | Version 1.0.0</span>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;