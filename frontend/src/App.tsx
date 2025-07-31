import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar } from 'antd';
import {
  DashboardOutlined,
  TableOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  FormOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import UnitsTable from './components/UnitsTable';
import ReservationsTable from './components/ReservationsTable';
import UploadData from './components/UploadData';
import ExportData from './components/ExportData';
import FormTemplates from './components/FormTemplates';
import GenerateForms from './components/GenerateForms';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState('1');

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      key: '2',
      icon: <TableOutlined />,
      label: 'Units Data',
      path: '/units',
    },
    {
      key: '3',
      icon: <FileTextOutlined />,
      label: 'Reservations & Contracts',
      path: '/reservations',
    },
    {
      key: '4',
      icon: <UploadOutlined />,
      label: 'Upload Units Data',
      path: '/upload',
    },
    {
      key: '5',
      icon: <CloudUploadOutlined />,
      label: 'Upload Reservations',
      path: '/upload-reservations',
    },
    {
      key: '6',
      icon: <DownloadOutlined />,
      label: 'Export Data',
      path: '/export',
    },
    {
      key: '7',
      icon: <FormOutlined />,
      label: 'Form Templates',
      path: '/form-templates',
    },
    {
      key: '8',
      icon: <PrinterOutlined />,
      label: 'Generate Forms',
      path: '/generate-forms',
    },
  ];

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
  };

  return (
    <div className="App">
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider 
            trigger={null} 
            collapsible 
            collapsed={collapsed}
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <div className="logo" style={{ 
              height: '64px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {collapsed ? 'ODM' : 'Operations Data Manager'}
            </div>
            
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selectedKey]}
              onClick={({ key }) => handleMenuClick(key)}
              items={menuItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: (
                  <a href={item.path} style={{ textDecoration: 'none' }}>
                    {item.label}
                  </a>
                ),
              }))}
            />
          </Sider>

          <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
            <Header style={{ 
              background: '#fff', 
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
            }}>
              <Title level={4} style={{ margin: 0, color: '#001529' }}>
                Operations Department - Data Management System
              </Title>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar icon={<SettingOutlined />} />
                <span>Admin User</span>
              </div>
            </Header>

            <Content style={{ 
              margin: '24px', 
              minHeight: 'calc(100vh - 112px)',
              background: '#f0f2f5'
            }}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/units" element={<UnitsTable />} />
                <Route path="/reservations" element={<ReservationsTable />} />
                <Route path="/upload" element={<UploadData />} />
                <Route path="/upload-reservations" element={<UploadData />} />
                <Route path="/export" element={<ExportData />} />
                <Route path="/form-templates" element={<FormTemplates />} />
                <Route path="/generate-forms" element={<GenerateForms />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </div>
  );
};

export default App; 