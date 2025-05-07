import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Avatar,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, SwapOutlined } from '@ant-design/icons';
import { getSites, getCategoriesFlat, createSite, updateSite, deleteSite, batchUpdateSiteCategory } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const SiteManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  // 获取网站和分类数据的函数
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sitesRes, categoriesRes] = await Promise.all([
        getSites(),
        getCategoriesFlat(), // 需要扁平化的分类列表用于下拉选择
      ]);
      setSites(sitesRes.data); // 假设数据在 data 字段
      setCategories(categoriesRes.data); // 假设数据在 data 字段
    } catch (error) {
      messageApi.open({ type: 'error', content: '获取数据列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理新增/编辑 Modal 的逻辑
  const showModal = (site = null) => {
    setEditingSite(site);
    if (site) {
      form.setFieldsValue(site);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSite(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingSite) {
        // 更新网站
        await updateSite(editingSite.id, values);
        messageApi.open({ type: 'success', content: '网站更新成功' });
      } else {
        // 创建网站
        await createSite(values);
        messageApi.open({ type: 'success', content: '网站创建成功' });
      }
      setIsModalVisible(false);
      setEditingSite(null);
      fetchData(); // 重新加载数据
    } catch (errorInfo) {
      console.log('Validate Failed:', errorInfo);
      messageApi.open({ type: 'error', content: `操作失败: ${errorInfo.response?.data?.message || '请检查输入'}` });
    } finally {
      setLoading(false);
    }
  };

  // 处理删除
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteSite(id);
      messageApi.open({ type: 'success', content: '网站删除成功' });
      fetchData(); // 重新加载数据
    } catch (error) {
      messageApi.open({ type: 'error', content: `删除失败: ${error.response?.data?.message || '请稍后重试'}` });
    } finally {
      setLoading(false);
    }
  };

  // 定义表格列
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 80,
      render: (logo, record) => (
        <Avatar
          shape="square"
          src={logo || ''} // 如果 logo 为空，给一个空字符串或默认图片
          icon={!logo ? <LinkOutlined /> : null}
          alt={record.title}
        />
      ),
    },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: 'URL', dataIndex: 'url', key: 'url', render: (url) => <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> },
    { title: '描述', dataIndex: 'desc', key: 'desc', ellipsis: true }, // ellipsis 属性可以自动省略过长文本
    {
      title: '分类',
      dataIndex: 'category_id', // API 返回的是 category_id
      key: 'category_id',
      // 从 categories 状态中查找对应的名称
      render: (categoryId) => categories.find(cat => cat.id === categoryId)?.name || '未分类',
    },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Popconfirm
            title={`确定删除网站 "${record.title}" 吗?`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>网站管理</Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Select
              placeholder="选择目标分类"
              style={{ width: 200 }}
              onChange={async (categoryId) => {
                try {
                  setLoading(true);
                  const response = await batchUpdateSiteCategory({
                    site_ids: selectedRowKeys,
                    category_id: categoryId
                  });
                  messageApi.success(`成功更新 ${response.data.affected_rows} 个站点的分类`);
                  setSelectedRowKeys([]);
                  fetchData();
                } catch (error) {
                  messageApi.error(`批量更新失败: ${error.response?.data?.message || '请稍后重试'}`);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
              ))}
            </Select>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            添加网站
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={sites}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }} // 可以添加分页
        scroll={{ x: 'max-content' }} // 如果列数较多，允许横向滚动
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
          },
        }}
      />

      {/* 新增/编辑网站的 Modal */}
      <Modal
        title={editingSite ? '编辑网站' : '新增网站'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        destroyOnClose
        width={600} // 可以适当调整 Modal 宽度
      >
        <Form form={form} layout="vertical" name="site_form">
          <Form.Item
            name="title"
            label="网站标题"
            rules={[{ required: true, message: '请输入网站标题!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="url"
            label="网站 URL"
            rules={[{ required: true, message: '请输入网站 URL!' }, { type: 'url', message: '请输入有效的 URL!' }]}
          >
            <Input placeholder="例如：https://www.example.com" />
          </Form.Item>
          <Form.Item
            name="category_id"
            label="所属分类"
            rules={[{ required: true, message: '请选择所属分类!' }]}
          >
            <Select showSearch placeholder="选择或搜索分类" optionFilterProp="children"
             filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase()) // 修正 filterOption, antd v5 option.children 不是直接的 string
              }>
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
          name="logo"
           label="网站 Logo (URL)"
        //   rules={[{ type: 'url', message: '请输入有效的 URL!' }]}
          >
            <Input placeholder="输入 Logo 图片的 URL" />
          </Form.Item>
          <Form.Item name="desc" label="网站描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SiteManagement;