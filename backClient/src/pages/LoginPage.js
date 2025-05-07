import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, getMe } from '../services/api';
import { setToken, removeToken, setUserInfo } from '../utils/auth';
import './LoginPage.css';

const { Title } = Typography;

const LoginPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Login and get token
      const loginResponse = await login(values);
      setToken(loginResponse.data.token);

      // 2. Get user info using the new token
      try {
        const meResponse = await getMe(); // Call getMe after successful login
        setUserInfo(meResponse.data.user); // Store user info
      } catch (meError) {
         // Handle error fetching user info (optional but recommended)
         console.error('Failed to fetch user info after login:', meError);
         removeToken(); // Fetching user info failed, consider login incomplete
         messageApi.open({ type: 'error', content: '获取用户信息失败，请重试。' });
         setLoading(false);
         return; // Stop execution
      }

      messageApi.open({ type: 'success', content: '登录成功!' });
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      // Clear potentially invalid token/user info if login itself fails
      removeToken();
      messageApi.open({ type: 'error', content: error.response?.data?.message || '登录失败，请检查用户名和密码。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {contextHolder}
      <Card className="login-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>WebStack 管理后台</Title>
        <Form
          name="normal_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          {/* 可选：添加注册或其他链接 */}
          {/* <div style={{ textAlign: 'center' }}>
            <a>注册账户</a> | <a>忘记密码?</a>
          </div> */}
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage; 