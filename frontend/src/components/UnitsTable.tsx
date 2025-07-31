import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { Card, Input, Button, Select, Space, Row, Col, message, Modal, Typography, Spin, Form, InputNumber, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { unitsApi } from '../services/api';
import { Unit, FilterOptions } from '../types';
import dayjs from 'dayjs';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const { Option } = Select;
const { Title } = Typography;

const UnitsTable: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    projects: [],
    types: [],
    salesStatuses: [],
    salesAgents: []
  });
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(100);
  
  // Selection
  const [selectedRows, setSelectedRows] = useState<Unit[]>([]);
  
  // Grid ref
  const [gridApi, setGridApi] = useState<any>(null);
  
  // Add Unit Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  
  // Edit Unit Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Column definitions
  const columnDefs: ColDef[] = [
    {
      headerName: 'Unit Code',
      field: 'unitCode',
      width: 120,
      pinned: 'left',
      cellStyle: { fontWeight: 'bold' }
    },
    {
      headerName: 'Project',
      field: 'project',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Type',
      field: 'type',
      width: 100,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Sales Status',
      field: 'salesStatus',
      width: 120,
      filter: 'agTextColumnFilter',
      cellStyle: (params) => {
        const status = params.value?.toLowerCase();
        return {
          color: status === 'sold' ? '#52c41a' : 
                 status === 'available' ? '#1890ff' : '#faad14',
          fontWeight: 'bold'
        };
      }
    },
    {
      headerName: 'Client Name',
      field: 'clientName',
      width: 180,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Block No',
      field: 'blockNo',
      width: 100
    },
    {
      headerName: 'Plot',
      field: 'plot',
      width: 80
    },
    {
      headerName: 'Floor',
      field: 'floor',
      width: 80
    },
    {
      headerName: 'Unit No',
      field: 'unitNo',
      width: 100
    },
    {
      headerName: 'BUA',
      field: 'bua',
      width: 100,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value ? `${params.value} m²` : ''
    },
    {
      headerName: 'Garden',
      field: 'garden',
      width: 100,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value ? `${params.value} m²` : ''
    },
    {
      headerName: 'Roof',
      field: 'roof',
      width: 100,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value ? `${params.value} m²` : ''
    },
    {
      headerName: 'Unit Price',
      field: 'unitPrice',
      width: 120,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value ? 
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0 
        }).format(params.value) : ''
    },
    {
      headerName: 'Contract Price',
      field: 'contractPrice',
      width: 130,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value ? 
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0 
        }).format(params.value) : ''
    },
    {
      headerName: 'Sales Agent',
      field: 'salesAgent',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Broker',
      field: 'brokerName',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Phone',
      field: 'phoneNumber',
      width: 130
    },
    {
      headerName: 'Address',
      field: 'address',
      width: 200,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Year',
      field: 'year',
      width: 80,
      type: 'numericColumn'
    },
    {
      headerName: 'Actions',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '100%' }}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(params.data)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(params.data)}
          />
        </div>
      )
    }
  ];

  const defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
    editable: false
  };

  useEffect(() => {
    fetchUnits();
    fetchFilterOptions();
  }, [currentPage, searchText, projectFilter, typeFilter, statusFilter]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await unitsApi.getUnits({
        page: currentPage,
        limit: pageSize,
        search: searchText,
        project: projectFilter,
        type: typeFilter,
        salesStatus: statusFilter
      });
      
      setUnits(response.data);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error: any) {
      message.error('Failed to fetch units data');
      console.error('Fetch units error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await unitsApi.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchUnits();
  }, [searchText, projectFilter, typeFilter, statusFilter]);

  const handleReset = () => {
    setSearchText('');
    setProjectFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsEditModalVisible(true);
    
    // Pre-populate form with unit data
    editForm.setFieldsValue({
      ...unit,
      date: unit.date ? dayjs(unit.date) : null,
      deliveryDate: unit.deliveryDate ? dayjs(unit.deliveryDate) : null,
    });
  };

  const handleAddUnit = () => {
    setIsAddModalVisible(true);
    addForm.resetFields();
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
    addForm.resetFields();
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      
      // Format dates if they exist
      const formattedValues = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        deliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : null,
      };

      await unitsApi.createUnit(formattedValues);
      message.success('Unit added successfully!');
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchUnits(); // Refresh the data
    } catch (error: any) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Failed to add unit');
      }
    }
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
    setEditingUnit(null);
  };

  const handleEditSubmit = async () => {
    if (!editingUnit) return;
    
    try {
      const values = await editForm.validateFields();
      
      // Format dates if they exist
      const formattedValues = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        deliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : null,
      };

      await unitsApi.updateUnit(editingUnit.id, formattedValues);
      message.success('Unit updated successfully!');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingUnit(null);
      fetchUnits(); // Refresh the data
    } catch (error: any) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Failed to update unit');
      }
    }
  };

  const handleDelete = (unit: Unit) => {
    Modal.confirm({
      title: 'Delete Unit',
      content: `Are you sure you want to delete unit ${unit.unitCode}?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await unitsApi.deleteUnit(unit.id);
          message.success('Unit deleted successfully');
          fetchUnits();
        } catch (error) {
          message.error('Failed to delete unit');
        }
      }
    });
  };

  const handleGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const handleSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    setSelectedRows(selectedData);
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('Please select units to delete');
      return;
    }

    Modal.confirm({
      title: 'Delete Selected Units',
      content: `Are you sure you want to delete ${selectedRows.length} selected units?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await Promise.all(selectedRows.map(unit => unitsApi.deleteUnit(unit.id)));
          message.success(`${selectedRows.length} units deleted successfully`);
          setSelectedRows([]);
          fetchUnits();
        } catch (error) {
          message.error('Failed to delete some units');
        }
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          Units Data Management
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUnit}>
            Add New Unit
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleBulkDelete}
            disabled={selectedRows.length === 0}
          >
            Delete Selected ({selectedRows.length})
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="filter-panel">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Search by name, unit code..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Select Project"
              value={projectFilter}
              onChange={setProjectFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.projects.map(project => (
                <Option key={project} value={project}>{project}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Select Type"
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.types.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Sales Status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.salesStatuses.map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={12} lg={8}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Search
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchUnits}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Data Grid */}
      <Card>
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <div 
            className="ag-theme-alpine units-table" 
            style={{ height: 'calc(100vh - 300px)', width: '100%' }}
          >
            <AgGridReact
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowData={units}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              onGridReady={handleGridReady}
              onSelectionChanged={handleSelectionChanged}
              pagination={true}
              paginationPageSize={pageSize}
              suppressPaginationPanel={false}
              animateRows={true}
              enableRangeSelection={true}
              enableCellTextSelection={true}
              getRowId={(params) => params.data.id.toString()}
            />
          </div>
        )}
        
        <div style={{ 
          marginTop: 16, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span>
            Showing {units.length} of {totalRecords} units
            {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
          </span>
        </div>
      </Card>

      {/* Add Unit Modal */}
      <Modal
        title="Add New Unit"
        open={isAddModalVisible}
        onOk={handleAddSubmit}
        onCancel={handleAddCancel}
        width={800}
        okText="Add Unit"
        cancelText="Cancel"
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{}}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Unit Code"
                name="unitCode"
                rules={[{ required: true, message: 'Please enter unit code' }]}
              >
                <Input placeholder="Enter unit code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Project"
                name="project"
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Type"
                name="type"
              >
                <Input placeholder="Enter unit type" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Sales Status"
                name="salesStatus"
              >
                <Select placeholder="Select sales status" allowClear>
                  <Select.Option value="Available">Available</Select.Option>
                  <Select.Option value="Sold">Sold</Select.Option>
                  <Select.Option value="Reserved">Reserved</Select.Option>
                  <Select.Option value="Under Construction">Under Construction</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Client Name"
                name="clientName"
              >
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phoneNumber"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Block No"
                name="blockNo"
              >
                <Input placeholder="Block number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Plot"
                name="plot"
              >
                <Input placeholder="Plot" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Floor"
                name="floor"
              >
                <Input placeholder="Floor" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Unit No"
                name="unitNo"
              >
                <Input placeholder="Unit number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="BUA (m²)"
                name="bua"
              >
                <InputNumber
                  placeholder="Built-up area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Garden (m²)"
                name="garden"
              >
                <InputNumber
                  placeholder="Garden area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Roof (m²)"
                name="roof"
              >
                <InputNumber
                  placeholder="Roof area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Outdoor (m²)"
                name="outdoor"
              >
                <InputNumber
                  placeholder="Outdoor area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Year"
                name="year"
              >
                <InputNumber
                  placeholder="Year"
                  style={{ width: '100%' }}
                  min={2000}
                  max={2050}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Unit Price"
                name="unitPrice"
              >
                <InputNumber
                  placeholder="Unit price"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Contract Price"
                name="contractPrice"
              >
                <InputNumber
                  placeholder="Contract price"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Price Installment"
                name="priceInstallment"
              >
                <InputNumber
                  placeholder="Price installment"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sales Agent"
                name="salesAgent"
              >
                <Input placeholder="Enter sales agent name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Broker Name"
                name="brokerName"
              >
                <Input placeholder="Enter broker name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Source"
                name="source"
              >
                <Input placeholder="Enter source" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
              >
                <Input placeholder="Enter address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Date"
                name="date"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Delivery Date"
                name="deliveryDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select delivery date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Grace Period (days)"
                name="gracePeriod"
              >
                <InputNumber
                  placeholder="Grace period"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Maintenance"
                name="maintenance"
              >
                <InputNumber
                  placeholder="Maintenance fee"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Parking"
                name="parking"
              >
                <Input placeholder="Enter parking details" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contract Finishing"
                name="contractFinishing"
              >
                <Input placeholder="Enter contract finishing details" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Comments"
                name="comments"
              >
                <Input.TextArea rows={3} placeholder="Enter comments" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        title="Edit Unit"
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        width={800}
        okText="Update Unit"
        cancelText="Cancel"
      >
        <Form
          form={editForm}
          layout="vertical"
          initialValues={{}}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Unit Code"
                name="unitCode"
                rules={[{ required: true, message: 'Please enter unit code' }]}
              >
                <Input placeholder="Enter unit code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Project"
                name="project"
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Type"
                name="type"
              >
                <Input placeholder="Enter unit type" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Sales Status"
                name="salesStatus"
              >
                <Select placeholder="Select sales status" allowClear>
                  <Select.Option value="Available">Available</Select.Option>
                  <Select.Option value="Sold">Sold</Select.Option>
                  <Select.Option value="Reserved">Reserved</Select.Option>
                  <Select.Option value="Under Construction">Under Construction</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Client Name"
                name="clientName"
              >
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phoneNumber"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Block No"
                name="blockNo"
              >
                <Input placeholder="Block number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Plot"
                name="plot"
              >
                <Input placeholder="Plot" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Floor"
                name="floor"
              >
                <Input placeholder="Floor" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Unit No"
                name="unitNo"
              >
                <Input placeholder="Unit number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="BUA (m²)"
                name="bua"
              >
                <InputNumber
                  placeholder="Built-up area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Garden (m²)"
                name="garden"
              >
                <InputNumber
                  placeholder="Garden area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Roof (m²)"
                name="roof"
              >
                <InputNumber
                  placeholder="Roof area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Outdoor (m²)"
                name="outdoor"
              >
                <InputNumber
                  placeholder="Outdoor area"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Year"
                name="year"
              >
                <InputNumber
                  placeholder="Year"
                  style={{ width: '100%' }}
                  min={2000}
                  max={2050}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Unit Price"
                name="unitPrice"
              >
                <InputNumber
                  placeholder="Unit price"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Contract Price"
                name="contractPrice"
              >
                <InputNumber
                  placeholder="Contract price"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Price Installment"
                name="priceInstallment"
              >
                <InputNumber
                  placeholder="Price installment"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sales Agent"
                name="salesAgent"
              >
                <Input placeholder="Enter sales agent name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Broker Name"
                name="brokerName"
              >
                <Input placeholder="Enter broker name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Source"
                name="source"
              >
                <Input placeholder="Enter source" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
              >
                <Input placeholder="Enter address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Date"
                name="date"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Delivery Date"
                name="deliveryDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select delivery date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Grace Period (days)"
                name="gracePeriod"
              >
                <InputNumber
                  placeholder="Grace period"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Maintenance"
                name="maintenance"
              >
                <InputNumber
                  placeholder="Maintenance fee"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Parking"
                name="parking"
              >
                <Input placeholder="Enter parking details" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contract Finishing"
                name="contractFinishing"
              >
                <Input placeholder="Enter contract finishing details" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Comments"
                name="comments"
              >
                <Input.TextArea rows={3} placeholder="Enter comments" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitsTable; 