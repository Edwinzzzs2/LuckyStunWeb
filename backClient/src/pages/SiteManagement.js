import React, { useState, useEffect } from "react";
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
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  getSites,
  getCategoriesFlat,
  createSite,
  updateSite,
  deleteSite,
  batchUpdateSiteCategory,
} from "../services/api";
const { Title } = Typography;

const SiteManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchTitle, setSearchTitle] = useState("");
  const [updatingVisibility, setUpdatingVisibility] = useState(null); // 跟踪正在更新显示状态的记录ID

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
      messageApi.open({ type: "error", content: "获取数据列表失败" });
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
        messageApi.open({ type: "success", content: "网站更新成功" });
      } else {
        // 创建网站
        await createSite(values);
        messageApi.open({ type: "success", content: "网站创建成功" });
      }
      setIsModalVisible(false);
      setEditingSite(null);
      fetchData(); // 重新加载数据
    } catch (errorInfo) {
      console.log("Validate Failed:", errorInfo);
      messageApi.open({
        type: "error",
        content: `操作失败: ${
          errorInfo.response?.data?.message || "请检查输入"
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 批量操作弹窗
  const showBatchModal = () => {
    batchForm.resetFields();
    setIsBatchModalVisible(true);
  };

  const handleBatchCancel = () => {
    setIsBatchModalVisible(false);
    batchForm.resetFields();
  };

  const handleBatchOk = async () => {
    try {
      const values = await batchForm.validateFields();
      setLoading(true);
      const response = await batchUpdateSiteCategory({
        site_ids: selectedRowKeys,
        category_id: values.category_id,
        is_visible: values.is_visible,
        port: values.port,
      });
      messageApi.success(response.data.message);
      setSelectedRowKeys([]);
      setIsBatchModalVisible(false);
      fetchData();
    } catch (error) {
      messageApi.error(
        `批量更新失败: ${error.response?.data?.message || "请稍后重试"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理删除
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteSite(id);
      messageApi.open({ type: "success", content: "网站删除成功" });
      fetchData(); // 重新加载数据
    } catch (error) {
      messageApi.open({
        type: "error",
        content: `删除失败: ${error.response?.data?.message || "请稍后重试"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理显示状态切换
  const handleVisibilityChange = async (id, checked) => {
    try {
      setUpdatingVisibility(id); // 设置正在更新的记录ID

      // 找到当前记录的完整信息
      const currentSite = sites.find((site) => site.id === id);
      if (!currentSite) {
        throw new Error("未找到网站信息");
      }

      // 传递完整的网站信息，只更新is_visible字段
      const updateData = {
        category_id: currentSite.category_id,
        url: currentSite.url,
        backup_url: currentSite.backup_url,
        internal_url: currentSite.internal_url,
        logo: currentSite.logo,
        title: currentSite.title,
        desc: currentSite.desc,
        sort_order: currentSite.sort_order,
        is_visible: checked,
      };

      await updateSite(id, updateData);
      messageApi.open({
        type: "success",
        content: `网站已${checked ? "显示" : "隐藏"}`,
      });
      fetchData(); // 重新加载数据
    } catch (error) {
      messageApi.open({
        type: "error",
        content: `状态更新失败: ${
          error.response?.data?.message || "请稍后重试"
        }`,
      });
    } finally {
      setUpdatingVisibility(null); // 清除loading状态
    }
  };

  // 定义表格列
  const columns = [
    {
      title: "序号",
      key: "index",
      width: 60,
      fixed: "left",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Logo",
      dataIndex: "logo",
      key: "logo",
      fixed: "left",
      width: 80,
      render: (logo, record) => {
        console.log(logo, record.title);
        return (
          <Avatar
            shape="square"
            src={logo || ""} // 如果 logo 为空，给一个空字符串或默认图片
            icon={!logo ? <LinkOutlined /> : null}
            alt={record.title}
          />
        );
      },
    },

    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 120,
      // fixed: "left",
    },
    {
      title: "主网站 URL",
      dataIndex: "url",
      key: "url",
      width: 240,
      render: (text) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "备用 URL",
      dataIndex: "backup_url",
      key: "backup_url",
      width: 240,
      render: (text) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "内网地址",
      dataIndex: "internal_url",
      key: "internal_url",
      width: 200,
      render: (text) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Icon地址",
      dataIndex: "logo",
      key: "logo_url",
      width: 240,
      render: (text) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "分类",
      dataIndex: "category_id", // API 返回的是 category_id
      key: "category_id",
      width: 120,
      // 从 categories 状态中查找对应的名称
      render: (categoryId) =>
        categories.find((cat) => cat.id === categoryId)?.name || "未分类",
      filters: categories.map((cat) => ({ text: cat.name, value: cat.id })),
      onFilter: (value, record) => record.category_id === value,
      filteredValue: categoryFilter ? [categoryFilter] : null,
    },
    {
      title: "描述",
      dataIndex: "desc",
      key: "desc",
      ellipsis: true,
      width: 160,
    }, // ellipsis 属性可以自动省略过长文本

    { title: "排序", dataIndex: "sort_order", key: "sort_order", width: 80 },

    { title: "ID", dataIndex: "id", key: "id", width: 50 },
    {
      title: "显示状态",
      dataIndex: "is_visible",
      key: "is_visible",
      width: 120,
      fixed: "right",
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          checkedChildren="显示"
          unCheckedChildren="隐藏"
          size="small"
          onChange={(checked) => handleVisibilityChange(record.id, checked)}
          loading={updatingVisibility === record.id}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 90,
      fixed: "right", // 固定在左侧
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            title="编辑"
          />
          <Popconfirm
            title={`确定删除网站 "${record.title}" 吗?`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="删除" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            网站管理
          </Title>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Input.Search
            placeholder="按标题搜索"
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setSearchTitle(e.target.value)}
            value={searchTitle}
            enterButton
          />
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={showBatchModal}
              >
                批量操作
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              添加网站
            </Button>
          </Space>
        </div>
      </div>

      {/* 过滤数据源：同时支持标题搜索和分类筛选 */}
      {(() => {
        let filteredSites = sites;

        // 按标题搜索过滤
        if (searchTitle) {
          filteredSites = filteredSites.filter((site) =>
            site.title.toLowerCase().includes(searchTitle.toLowerCase())
          );
        }

        // 按分类筛选过滤
        if (categoryFilter) {
          filteredSites = filteredSites.filter(
            (site) => site.category_id === categoryFilter
          );
        }

        return (
          <Table
            columns={columns}
            dataSource={filteredSites}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: filteredSites.length,
              showSizeChanger: false,
              hideOnSinglePage: true,
            }}
            scroll={{
              x: 1800, // 增加最小宽度以适应新的Icon地址列
              y: "calc(100vh - 380px)", // 动态计算高度，减去页面其他元素的高度
            }}
            style={{
              width: "100%",
              overflowX: "auto", // 强制横向滚动
            }}
            rowSelection={{
              selectedRowKeys,
              onChange: (newSelectedRowKeys) => {
                setSelectedRowKeys(newSelectedRowKeys);
              },
            }}
            // 添加响应式配置
            responsive={true}
            // tableLayout="fixed" // 移除固定布局，让列宽度能够自适应
            onChange={(pagination, filters) => {
              if (filters.category_id && filters.category_id.length > 0) {
                setCategoryFilter(filters.category_id[0]);
              } else {
                setCategoryFilter(null);
              }
            }}
          />
        );
      })()}

      {/* 新增/编辑网站的 Modal */}
      <Modal
        title={editingSite ? "编辑网站" : "新增网站"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        destroyOnClose
        width={500}
        bodyStyle={{
          maxHeight: "50vh", // 减小最大高度
          overflowY: "auto", // 超出部分可滚动
          // paddingBottom: '60px' // 为底部按钮预留空间
        }}
        modalRender={(modal) => (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              display: "flex",
              flexDirection: "column",
              height: "70vh", // 固定总高度
              maxHeight: "70vh",
            }}
          >
            <div
              style={{
                flex: "1",
                overflowY: "auto",
                paddingRight: "8px",
              }}
            >
              {modal}
            </div>
          </div>
        )}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleOk}
          >
            确定
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          name="site_form"
          requiredMark={false}
          style={{
            maxWidth: "100%",
            padding: "0 8px",
          }}
        >
          <Form.Item
            name="title"
            label="网站标题"
            rules={[{ required: true, message: "请输入网站标题!" }]}
          >
            <Input placeholder="输入网站标题" />
          </Form.Item>
          <Form.Item
            name="url"
            label="主网站 URL"
            rules={[
              { required: true, message: "请输入主网站 URL!" },
              { type: "url", message: "请输入有效的 URL!" },
            ]}
          >
            <Input placeholder="https://www.example.com" />
          </Form.Item>

          <Form.Item
            name="backup_url"
            label="备用 URL"
            rules={[{ type: "url", message: "请输入有效的 URL!" }]}
          >
            <Input placeholder="https://backup.example.com" />
          </Form.Item>

          <Form.Item
            name="internal_url"
            label="内网地址"
            rules={[{ type: "url", message: "请输入有效的 URL!" }]}
          >
            <Input placeholder="http://192.168.1.100" />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="所属分类"
            rules={[{ required: true, message: "请选择所属分类!" }]}
          >
            <Select
              showSearch
              placeholder="选择分类"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="logo" label="网站 Logo (URL)">
            <Input placeholder="Logo 图片 URL" />
          </Form.Item>
          <Form.Item name="desc" label="网站描述">
            <Input.TextArea rows={3} placeholder="输入网站简介" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="数字越小越靠前"
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <span style={{ marginRight: "8px" }}>显示状态:</span>
            <Form.Item
              name="is_visible"
              valuePropName="checked"
              initialValue={true}
              style={{ marginBottom: 0 }}
            >
              <Switch
                defaultChecked
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 批量操作 Modal */}
      <Modal
        title="批量操作"
        open={isBatchModalVisible}
        onOk={handleBatchOk}
        onCancel={handleBatchCancel}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={batchForm}
          layout="vertical"
          name="batch_form"
          requiredMark={false}
        >
          <Form.Item
            name="category_id"
            label="目标分类"
            rules={[{ required: true, message: "请选择目标分类!" }]}
          >
            <Select placeholder="选择分类">
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="is_visible"
            label="显示状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="显示"
              unCheckedChildren="隐藏"
              defaultChecked
            />
          </Form.Item>

          <Form.Item
            name="port"
            label="设置端口"
            tooltip="可选项，批量更新URL中的端口"
          >
            <InputNumber
              placeholder="例如: 8080"
              style={{ width: "100%" }}
              min={1}
              max={65535}
            />
          </Form.Item>

          <div style={{ marginTop: "16px", color: "#999" }}>
            已选择 {selectedRowKeys.length} 个站点
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SiteManagement;
