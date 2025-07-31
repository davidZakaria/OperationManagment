import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, Alert } from 'antd';
import { 
  HomeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { unitsApi } from '../services/api';
import { DashboardStats, Unit } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await unitsApi.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const recentUnitsColumns = [
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
      width: 120,
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 150,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 180,
    },
    {
      title: 'Sales Status',
      dataIndex: 'salesStatus',
      key: 'salesStatus',
      width: 120,
      render: (status: string) => (
        <span style={{ 
          color: status?.toLowerCase() === 'sold' ? '#52c41a' : 
                status?.toLowerCase() === 'available' ? '#1890ff' : '#faad14',
          fontWeight: 'bold'
        }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Added Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <button onClick={fetchDashboardStats} style={{ border: 'none', background: 'none', color: '#1890ff', cursor: 'pointer' }}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          Dashboard Overview
        </Title>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Units"
              value={stats?.totalUnits || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Sold Units"
              value={stats?.soldUnits || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Available Units"
              value={stats?.availableUnits || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Value"
              value={formatCurrency(stats?.totalValue || 0)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Sales Summary" extra={<TrophyOutlined />}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Sold"
                  value={stats?.soldUnits || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Available"
                  value={stats?.availableUnits || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Reserved"
                  value={stats?.reservedUnits || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Performance Metrics">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Sales Rate"
                  value={stats?.totalUnits ? 
                    Math.round((stats.soldUnits / stats.totalUnits) * 100) : 0
                  }
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Availability Rate"
                  value={stats?.totalUnits ? 
                    Math.round((stats.availableUnits / stats.totalUnits) * 100) : 0
                  }
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Units Table */}
      <Card title="Recently Added Units" style={{ marginBottom: 24 }}>
        <Table
          columns={recentUnitsColumns}
          dataSource={stats?.recentUnits || []}
          pagination={false}
          size="small"
          rowKey="id"
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card 
            hoverable
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => window.location.href = '/upload'}
          >
            <HomeOutlined style={{ fontSize: '2rem', color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Upload New Data</Title>
            <p>Import Excel files with unit information</p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            hoverable
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => window.location.href = '/units'}
          >
            <CheckCircleOutlined style={{ fontSize: '2rem', color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>Manage Units</Title>
            <p>View, edit, and manage unit data</p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            hoverable
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => window.location.href = '/export'}
          >
            <DollarOutlined style={{ fontSize: '2rem', color: '#faad14', marginBottom: 16 }} />
            <Title level={4}>Export Data</Title>
            <p>Download filtered data as Excel files</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 