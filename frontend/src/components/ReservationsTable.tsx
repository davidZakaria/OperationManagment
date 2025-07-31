import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { Card, Input, Button, Select, Space, Row, Col, message, Modal, Typography, Spin, Form, InputNumber, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { reservationsApi } from '../services/api';
import { Reservation, ReservationFilterOptions } from '../types';
import dayjs from 'dayjs';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const { Option } = Select;
const { Title } = Typography;

const ReservationsTable: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<ReservationFilterOptions>({
    nationalities: [],
    currencies: [],
    paymentMethods: [],
    salesPeople: [],
    salesManagers: []
  });
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(100);
  
  // Selection
  const [selectedRows, setSelectedRows] = useState<Reservation[]>([]);
  
  // Grid ref
  const [gridApi, setGridApi] = useState<any>(null);
  
  // Add Reservation Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  
  // Edit Reservation Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Column definitions
  const columnDefs: ColDef[] = [
    {
      headerName: 'Reservation Code',
      field: 'reservationCode',
      width: 140,
      pinned: 'left',
      cellStyle: { fontWeight: 'bold' }
    },
    {
      headerName: 'SR',
      field: 'sr',
      width: 80,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Reservation Date',
      field: 'reservationDate',
      width: 130,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      headerName: 'Client Name',
      field: 'clientName',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Nationality',
      field: 'nationality',
      width: 120,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'ID/Passport',
      field: 'idPassport',
      width: 120,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Date of ID',
      field: 'dateOfId',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      headerName: 'Serial Num. of ID',
      field: 'serialNumOfId',
      width: 130,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Address',
      field: 'address',
      width: 200,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 180,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Home Number',
      field: 'homeNumber',
      width: 120,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Mobile Number',
      field: 'mobileNumber',
      width: 130,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Unit Code',
      field: 'unitCode',
      width: 120,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Payment',
      field: 'payment',
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
      headerName: 'Deposit',
      field: 'deposit',
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
      headerName: 'Currency',
      field: 'currency',
      width: 100,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Payment Method',
      field: 'paymentMethod',
      width: 130,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Deposit/Transfer Number',
      field: 'depositTransferNumber',
      width: 160,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Date of Deposit/Transfer',
      field: 'dateOfDepositTransfer',
      width: 160,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      headerName: 'Bank Name',
      field: 'bankName',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Sales',
      field: 'sales',
      width: 120,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Sales Manager',
      field: 'salesManager',
      width: 130,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Senior Sales Manager',
      field: 'seniorSalesManager',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Cancel',
      field: 'cancel',
      width: 100,
      filter: 'agTextColumnFilter',
      cellStyle: (params) => {
        const status = params.value?.toLowerCase();
        return {
          color: status && status !== '' ? '#ff4d4f' : '#52c41a',
          fontWeight: 'bold'
        };
      }
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
    fetchReservations();
    fetchFilterOptions();
  }, [currentPage, searchText, nationalityFilter, currencyFilter, paymentMethodFilter, salesFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationsApi.getReservations({
        page: currentPage,
        limit: pageSize,
        search: searchText,
        nationality: nationalityFilter,
        currency: currencyFilter,
        paymentMethod: paymentMethodFilter,
        sales: salesFilter
      });
      
      setReservations(response.data);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error: any) {
      message.error('Failed to fetch reservations data');
      console.error('Fetch reservations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await reservationsApi.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchReservations();
  }, [searchText, nationalityFilter, currencyFilter, paymentMethodFilter, salesFilter]);

  const handleReset = () => {
    setSearchText('');
    setNationalityFilter('');
    setCurrencyFilter('');
    setPaymentMethodFilter('');
    setSalesFilter('');
    setCurrentPage(1);
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsEditModalVisible(true);
    
    // Pre-populate form with reservation data
    editForm.setFieldsValue({
      ...reservation,
      reservationDate: reservation.reservationDate ? dayjs(reservation.reservationDate) : null,
      dateOfId: reservation.dateOfId ? dayjs(reservation.dateOfId) : null,
      dateOfDepositTransfer: reservation.dateOfDepositTransfer ? dayjs(reservation.dateOfDepositTransfer) : null,
    });
  };

  const handleAddReservation = () => {
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
        reservationDate: values.reservationDate ? values.reservationDate.toISOString() : null,
        dateOfId: values.dateOfId ? values.dateOfId.toISOString() : null,
        dateOfDepositTransfer: values.dateOfDepositTransfer ? values.dateOfDepositTransfer.toISOString() : null,
      };

      await reservationsApi.createReservation(formattedValues);
      message.success('Reservation created successfully');
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchReservations();
    } catch (error: any) {
      message.error('Failed to create reservation');
      console.error('Create reservation error:', error);
    }
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
    setEditingReservation(null);
  };

  const handleEditSubmit = async () => {
    try {
      if (!editingReservation) return;
      
      const values = await editForm.validateFields();
      
      // Format dates if they exist
      const formattedValues = {
        ...values,
        reservationDate: values.reservationDate ? values.reservationDate.toISOString() : null,
        dateOfId: values.dateOfId ? values.dateOfId.toISOString() : null,
        dateOfDepositTransfer: values.dateOfDepositTransfer ? values.dateOfDepositTransfer.toISOString() : null,
      };

      await reservationsApi.updateReservation(editingReservation.id, formattedValues);
      message.success('Reservation updated successfully');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingReservation(null);
      fetchReservations();
    } catch (error: any) {
      message.error('Failed to update reservation');
      console.error('Update reservation error:', error);
    }
  };

  const handleDelete = (reservation: Reservation) => {
    Modal.confirm({
      title: 'Delete Reservation',
      content: `Are you sure you want to delete reservation "${reservation.reservationCode}"?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await reservationsApi.deleteReservation(reservation.id);
          message.success('Reservation deleted successfully');
          fetchReservations();
        } catch (error: any) {
          message.error('Failed to delete reservation');
          console.error('Delete reservation error:', error);
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const blob = await reservationsApi.exportReservations({
        search: searchText,
        nationality: nationalityFilter,
        currency: currencyFilter,
        paymentMethod: paymentMethodFilter,
        sales: salesFilter
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reservations-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Export completed successfully');
    } catch (error: any) {
      message.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    setSelectedRows(selectedData);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <Title level={2}>Reservation and Contract Data Management</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search reservations..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Nationality"
              value={nationalityFilter}
              onChange={setNationalityFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {filterOptions.nationalities.map(nationality => (
                <Option key={nationality} value={nationality}>{nationality}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Currency"
              value={currencyFilter}
              onChange={setCurrencyFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {filterOptions.currencies.map(currency => (
                <Option key={currency} value={currency}>{currency}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Payment Method"
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {filterOptions.paymentMethods.map(method => (
                <Option key={method} value={method}>{method}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Sales"
              value={salesFilter}
              onChange={setSalesFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {filterOptions.salesPeople.map(sales => (
                <Option key={sales} value={sales}>{sales}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Search
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddReservation} style={{ marginRight: 8 }}>
              Add Reservation
            </Button>
            <Button onClick={handleExport}>
              Export to Excel
            </Button>
          </div>
          
          <div>
            {selectedRows.length > 0 && (
              <span style={{ marginRight: 16 }}>
                {selectedRows.length} selected
              </span>
            )}
            <span>
              Total: {totalRecords} reservations
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              rowData={reservations}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              rowSelection="multiple"
              suppressRowClickSelection={true}
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

        {totalRecords > pageSize && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span style={{ margin: '0 16px' }}>
              Page {currentPage} of {Math.ceil(totalRecords / pageSize)}
            </span>
            <Button
              disabled={currentPage === Math.ceil(totalRecords / pageSize)}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Add Reservation Modal */}
      <Modal
        title="Add New Reservation"
        open={isAddModalVisible}
        onOk={handleAddSubmit}
        onCancel={handleAddCancel}
        width={800}
        okText="Create"
        cancelText="Cancel"
      >
        <Form form={addForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reservationCode"
                label="Reservation Code"
                rules={[{ required: true, message: 'Please enter reservation code' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sr" label="SR">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reservationDate" label="Reservation Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clientName" label="Client Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nationality" label="Nationality">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idPassport" label="ID/Passport">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateOfId" label="Date of ID">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serialNumOfId" label="Serial Num. of ID">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="homeNumber" label="Home Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="mobileNumber" label="Mobile Number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitCode" label="Unit Code">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="payment" label="Payment">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deposit" label="Deposit">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Currency">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Payment Method">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="depositTransferNumber" label="Number of Deposit/Transfer">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateOfDepositTransfer" label="Date of Deposit/Transfer">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankName" label="Bank Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sales" label="Sales">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salesManager" label="Sales Manager">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="seniorSalesManager" label="Senior Sales Manager">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="cancel" label="Cancel">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Reservation Modal */}
      <Modal
        title="Edit Reservation"
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        width={800}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reservationCode"
                label="Reservation Code"
                rules={[{ required: true, message: 'Please enter reservation code' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sr" label="SR">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reservationDate" label="Reservation Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clientName" label="Client Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nationality" label="Nationality">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idPassport" label="ID/Passport">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateOfId" label="Date of ID">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serialNumOfId" label="Serial Num. of ID">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="homeNumber" label="Home Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="mobileNumber" label="Mobile Number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitCode" label="Unit Code">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="payment" label="Payment">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deposit" label="Deposit">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Currency">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Payment Method">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="depositTransferNumber" label="Number of Deposit/Transfer">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateOfDepositTransfer" label="Date of Deposit/Transfer">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankName" label="Bank Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sales" label="Sales">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salesManager" label="Sales Manager">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="seniorSalesManager" label="Senior Sales Manager">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="cancel" label="Cancel">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ReservationsTable; 