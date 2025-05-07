import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Tag,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { getUsers, createUser, deleteUser, updateUserPassword } from '../services/api';

const { Title } = Typography;

const UserManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [createUserForm] = Form.useForm();
  const [updatePasswordForm] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data.users);
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: '获取用户列表失败',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showCreateModal = () => {
    createUserForm.resetFields();
    setIsCreateModalVisible(true);
  };

  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
  };

  const handleCreateOk = async () => {
    try {
      const values = await createUserForm.validateFields();
      const userData = { ...values, isAdmin: !!values.isAdmin };
      setLoading(true);
      const res = await createUser(userData);
      console.log(res);
      messageApi.open({
        type: 'success',
        content: res.data.message || '用户创建成功！',
      });
      setIsCreateModalVisible(false);
      fetchUsers();
    } catch (errorInfo) {
      console.log('Create User Failed:', errorInfo);
      messageApi.open({
        type: 'error',
        content: `创建用户失败: ${errorInfo.response?.data?.message || '请检查输入'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const showPasswordModal = (user) => {
    setEditingUser(user);
    updatePasswordForm.resetFields();
    setIsPasswordModalVisible(true);
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalVisible(false);
    setEditingUser(null);
  };

  const handlePasswordOk = async () => {
    if (!editingUser) return;
    try {
      const values = await updatePasswordForm.validateFields();
      const payload = {
        userId: editingUser.id,
        newPassword: values.newPassword,
      };
      setLoading(true);
      const response = await updateUserPassword(payload);
      const successMessage = response?.data?.message || `用户 ${editingUser.username} 的密码更新成功！`;
      messageApi.open({
        type: 'success',
        content: successMessage,
      });
      setIsPasswordModalVisible(false);
      setEditingUser(null);
    } catch (errorInfo) {
      console.log('Update Password Failed:', errorInfo);
      messageApi.open({
        type: 'error',
        content: `密码更新失败: ${errorInfo.response?.data?.message || '请检查输入'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteUser(id);
      messageApi.open({
        type: 'success',
        content: '用户删除成功',
      });
      fetchUsers();
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: `删除失败: ${error.response?.data?.message || '请稍后重试'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '用户类型',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      render: (isAdmin) => (
        <Tag color={isAdmin ? 'volcano' : 'geekblue'}>
          {isAdmin ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showPasswordModal(record)}
            disabled={loading}
            title="修改密码"
          />
          <Popconfirm
            title={`确定删除用户 "${record.username}" 吗?`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={loading}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              disabled={loading}
              title="删除用户"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const checkAdminAndFetchUsers = async () => {
    setLoading(true);
    try {
      await fetchUsers();
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: '刷新用户列表失败',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          marginBottom: 16 
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%' 
          }}
        >
          <Title level={2} style={{ margin: 0 }}>后台管理</Title>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            width: '100%' 
          }}
        >
          <Space>
            <Button
              icon={<SyncOutlined spin={loading} />}
              onClick={checkAdminAndFetchUsers}
              disabled={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              disabled={loading}
            >
              新增用户
            </Button>
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增用户"
        open={isCreateModalVisible}
        onOk={handleCreateOk}
        onCancel={handleCreateCancel}
        confirmLoading={loading}
        destroyOnClose
        width={500}
        bodyStyle={{ 
          maxHeight: '50vh', 
          overflowY: 'auto' 
        }}
        modalRender={(modal) => (
          <div style={{ 
            padding: '16px', 
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            height: '70vh', 
            maxHeight: '70vh'
          }}>
            <div style={{ 
              flex: '1', 
              overflowY: 'auto',
              paddingRight: '8px' 
            }}>
              {modal}
            </div>
          </div>
        )}
      >
        <Form 
          form={createUserForm} 
          layout="vertical" 
          name="create_user_form"
          requiredMark={false}
          style={{ 
            maxWidth: '100%', 
            padding: '0 8px' 
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="新用户用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少需要6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码 (至少6位)" />
          </Form.Item>
          <Form.Item
            name="isAdmin"
            label="设为管理员"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`修改用户 "${editingUser?.username}" 的密码`}
        open={isPasswordModalVisible}
        onOk={handlePasswordOk}
        onCancel={handlePasswordCancel}
        confirmLoading={loading}
        destroyOnClose
        width={500}
        bodyStyle={{ 
          maxHeight: '50vh', 
          overflowY: 'auto' 
        }}
        modalRender={(modal) => (
          <div style={{ 
            padding: '16px', 
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            height: '70vh', 
            maxHeight: '70vh'
          }}>
            <div style={{ 
              flex: '1', 
              overflowY: 'auto',
              paddingRight: '8px' 
            }}>
              {modal}
            </div>
          </div>
        )}
      >
        <Form 
          form={updatePasswordForm} 
          layout="vertical" 
          name="update_password_form"
          requiredMark={false}
          style={{ 
            maxWidth: '100%', 
            padding: '0 8px' 
          }}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码!' },
              { min: 6, message: '密码至少需要6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码 (至少6位)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;