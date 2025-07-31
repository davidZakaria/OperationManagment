import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Input, 
  Row, 
  Col, 
  Typography, 
  Space,
  Alert,
  Spin,
  message
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  SearchOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { unitsApi } from '../services/api';
import { FilterOptions } from '../types';

const { Option } = Select;
const { Title, Text } = Typography;

const ExportData: React.FC = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    projects: [],
    types: [],
    salesStatuses: [],
    salesAgents: []
  });
  
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    type: '',
    salesStatus: ''
  });
  
  const [exporting, setExporting] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      setLoadingFilters(true);
      const options = await unitsApi.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      message.error('Failed to load filter options');
      console.error('Failed to fetch filter options:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const exportParams = {
        search: filters.search || undefined,
        project: filters.project || undefined,
        type: filters.type || undefined,
        salesStatus: filters.salesStatus || undefined
      };

      const blob = await unitsApi.exportUnits(exportParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date and filters
      const date = new Date().toISOString().split('T')[0];
      let filename = `units-export-${date}`;
      
      if (filters.project) filename += `-${filters.project.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (filters.type) filename += `-${filters.type.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (filters.salesStatus) filename += `-${filters.salesStatus.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Export completed successfully!');
    } catch (error: any) {
      message.error('Export failed: ' + (error.response?.data?.error || error.message));
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    setFilters({
      search: '',
      project: '',
      type: '',
      salesStatus: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          Export Excel Data
        </Title>
      </div>

      {/* Export Instructions */}
      <Alert
        message="Export Instructions"
        description={
          <div>
            <p>Use the filters below to customize your export. You can:</p>
            <ul>
              <li>Search by client name, unit code, or other text fields</li>
              <li>Filter by specific project, type, or sales status</li>
              <li>Leave all filters empty to export all data</li>
              <li>The exported file will include all columns from your database</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Filter Panel */}
      <Card title="Export Filters" style={{ marginBottom: 24 }}>
        {loadingFilters ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>Search Text</Text>
                  <Input
                    placeholder="Search by name, unit code..."
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    allowClear
                  />
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>Project</Text>
                  <Select
                    placeholder="Select Project"
                    value={filters.project}
                    onChange={(value) => handleFilterChange('project', value)}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {filterOptions.projects.map(project => (
                      <Option key={project} value={project}>{project}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>Type</Text>
                  <Select
                    placeholder="Select Type"
                    value={filters.type}
                    onChange={(value) => handleFilterChange('type', value)}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {filterOptions.types.map(type => (
                      <Option key={type} value={type}>{type}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>Sales Status</Text>
                  <Select
                    placeholder="Select Status"
                    value={filters.salesStatus}
                    onChange={(value) => handleFilterChange('salesStatus', value)}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {filterOptions.salesStatuses.map(status => (
                      <Option key={status} value={status}>{status}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleReset}
                  disabled={!hasActiveFilters}
                >
                  Reset Filters
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchFilterOptions}
                >
                  Refresh Options
                </Button>
              </Space>
            </div>
          </>
        )}
      </Card>

      {/* Export Section */}
      <Card title="Export Options">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <FileExcelOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: 24 }} />
          
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>Ready to Export</Title>
            <Text type="secondary">
              {hasActiveFilters 
                ? 'Export filtered data based on your selections above'
                : 'Export all units data'
              }
            </Text>
          </div>

          {hasActiveFilters && (
            <div style={{ marginBottom: 24 }}>
              <Text strong>Active Filters:</Text>
              <div style={{ marginTop: 8 }}>
                {filters.search && (
                  <Text code style={{ margin: '0 4px' }}>Search: "{filters.search}"</Text>
                )}
                {filters.project && (
                  <Text code style={{ margin: '0 4px' }}>Project: {filters.project}</Text>
                )}
                {filters.type && (
                  <Text code style={{ margin: '0 4px' }}>Type: {filters.type}</Text>
                )}
                {filters.salesStatus && (
                  <Text code style={{ margin: '0 4px' }}>Status: {filters.salesStatus}</Text>
                )}
              </div>
            </div>
          )}

          <Button 
            type="primary" 
            size="large"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExport}
            style={{ minWidth: 200 }}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>

        <Alert
          message="Export Information"
          description={
            <div>
              <p><strong>What's included in the export:</strong></p>
              <ul>
                <li>All visible columns with properly formatted data</li>
                <li>Date fields in readable format (YYYY-MM-DD)</li>
                <li>Currency fields with proper formatting</li>
                <li>All text and numeric data as entered</li>
              </ul>
              <p><strong>File format:</strong> Excel (.xlsx) compatible with Microsoft Excel, Google Sheets, and other spreadsheet applications.</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default ExportData; 