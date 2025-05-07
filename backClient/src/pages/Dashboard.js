import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { ReadOutlined, GithubOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Paragraph, Link } = Typography;

const Dashboard = () => {
  // 可以在这里添加获取统计数据的逻辑
  return (
    <div>
      <Title level={2}>关于项目</Title>
      <Paragraph>
        这是一个开源的网址导航网站项目，您可以拿来制作自己的网址导航，也可以做与导航无关的网站。
        网站后台静态页面采用 <Link href="#">WebStack</Link> 项目源码。
        如果对本项目有任何建议都可以发起 <Link href="#">issue</Link>。
      </Paragraph>

      <Title level={3} style={{ marginTop: '30px' }}>关于作者</Title>
      <Paragraph>
        <GithubOutlined /> GitHub 地址: <Link href="#" target="_blank">查看</Link>
      </Paragraph>
      <Paragraph>
        <MailOutlined /> E-mail 地址: xxx@xxxx.com
      </Paragraph>
      <Paragraph>
        如果您有更好的想法，可以通过邮件与我联系，欢迎与我交流分享。
      </Paragraph>

      {/* Optional: Add some statistics cards */}
      {/*
      <Title level={3} style={{ marginTop: '30px' }}>数据统计</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="分类总数" value={10} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="网站总数" value={50} prefix={<GlobalOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="用户数" value={5} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>
      */}
    </div>
  );
};

export default Dashboard; 