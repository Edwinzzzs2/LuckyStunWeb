// src/pages/CategoryManagement.js
import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Space, Tree } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCategoriesTree, getCategoriesFlat, createCategory, updateCategory, deleteCategory } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const CategoryManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const treeRes = await getCategoriesTree();
      const flatRes = await getCategoriesFlat();
      setCategories(treeRes.data);
      setFlatCategories(flatRes.data);
    } catch (error) {
      messageApi.open({ type: 'error', content: '获取分类列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        ...category,
        parent_id: category.parent_id || undefined,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        messageApi.open({ type: 'success', content: '分类更新成功' });
      } else {
        await createCategory(values);
        messageApi.open({ type: 'success', content: '分类创建成功' });
      }
      setIsModalVisible(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (errorInfo) {
      console.log('Validate Failed:', errorInfo);
      messageApi.open({ type: 'error', content: `操作失败: ${errorInfo.response?.data?.message || '请检查输入'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteCategory(id);
      messageApi.open({ type: 'success', content: '分类删除成功' });
      fetchCategories();
    } catch (error) {
      messageApi.open({ type: 'error', content: `删除失败: ${error.response?.data?.message || '请稍后重试'}` });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '英文名称', dataIndex: 'en_name', key: 'en_name' },
    { title: '图标', dataIndex: 'icon', key: 'icon', render: (icon) => <i className={icon}></i> },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Popconfirm
            title={`确定删除分类 "${record.name}" 吗?`}
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

  const renderTreeNodes = (data) =>
    data.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <Tree.TreeNode
            title={
              <Space>
                <span>{item.name} ({item.en_name})</span>
                <Button size="small" type="link" icon={<EditOutlined />} onClick={() => showModal(item)}>编辑</Button>
                <Popconfirm
                  title={`确定删除分类 "${item.name}" 及其所有子分类吗?`}
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            }
            key={item.id}
            dataRef={item}
          >
            {renderTreeNodes(item.children)}
          </Tree.TreeNode>
        );
      }
      return (
        <Tree.TreeNode
         title={
            <Space>
                <span>{item.name} ({item.en_name})</span>
                <Button size="small" type="link" icon={<EditOutlined />} onClick={() => showModal(item)}>编辑</Button>
                <Popconfirm
                  title={`确定删除分类 "${item.name}" 吗?`}
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
          }
          key={item.id}
          dataRef={item}
        />
      );
    });

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, }}>
        <Title level={2} style={{ margin: 0 }}>分类管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          添加分类
        </Button>
      </div>

      <Tree
        showLine
        defaultExpandAll
        treeData={categories}
        titleRender={(nodeData) => (
          <Space>
            <span>{nodeData.name} {nodeData.en_name ? `(${nodeData.en_name})` : ''} {nodeData.icon ? <i className={nodeData.icon}/> : null} (排序: {nodeData.sort_order ?? '默认'})</span>
            <Button size="small" type="link" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); showModal(nodeData); }}>编辑</Button>
            <Popconfirm
              title={`确定删除分类 "${nodeData.name}" 吗? ${nodeData.children && nodeData.children.length > 0 ? '其子分类和关联网站也会受影响！' : ''}`}
              onConfirm={(e) => { e.stopPropagation(); handleDelete(nodeData.id); }}
              onCancel={(e) => e.stopPropagation()}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>删除</Button>
            </Popconfirm>
          </Space>
        )}
        fieldNames={{ title: 'name', key: 'id', children: 'children' }}
        loading={loading}
      />

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="category_form">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="en_name" label="英文名称">
            <Input />
          </Form.Item>
          <Form.Item name="icon" label="图标 (Font Awesome 类名)">
             <Input placeholder="例如：fas fa-star" />
          </Form.Item>
          <Form.Item name="parent_id" label="父级分类">
            <Select allowClear placeholder="选择父级分类 (留空为顶级分类)">
              {flatCategories.map(cat => (
                 editingCategory && (cat.id === editingCategory.id || isDescendant(flatCategories, editingCategory.id, cat.id)) ? null :
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

function isDescendant(categories, parentId, childId) {
    const children = categories.filter(c => c.parent_id === parentId);
    for (const child of children) {
        if (child.id === childId) return true;
        if (isDescendant(categories, child.id, childId)) return true;
    }
    return false;
}

export default CategoryManagement; 