import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Progress, 
  Alert, 
  Typography, 
  Table, 
  message,
  Space,
  Divider,
  List
} from 'antd';
import { 
  UploadOutlined, 
  FileExcelOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  HistoryOutlined 
} from '@ant-design/icons';
import { uploadApi, uploadReservationsApi } from '../services/api';
import { UploadResponse, ImportHistory } from '../types';

const { Title, Text } = Typography;

const UploadData: React.FC = () => {
  const location = useLocation();
  const isReservationUpload = location.pathname === '/upload-reservations';
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadHistory, setUploadHistory] = useState<ImportHistory[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  React.useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const history = isReservationUpload 
        ? await uploadReservationsApi.getUploadHistory()
        : await uploadApi.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      console.error('Failed to fetch upload history:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadResult(null);

      const result = isReservationUpload
        ? await uploadReservationsApi.uploadFile(selectedFile, (progress) => {
            setUploadProgress(progress);
          })
        : await uploadApi.uploadFile(selectedFile, (progress) => {
            setUploadProgress(progress);
          });

      setUploadResult(result);
      message.success('File uploaded and processed successfully!');
      fetchUploadHistory();
      setSelectedFile(null);
    } catch (error: any) {
      message.error('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const errorColumns = [
    {
      title: isReservationUpload ? 'Reservation Code' : 'Unit Code',
      dataIndex: isReservationUpload ? 'reservationCode' : 'unitCode',
      key: isReservationUpload ? 'reservationCode' : 'unitCode',
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          {isReservationUpload ? 'Upload Reservations Data' : 'Upload Units Data'}
        </Title>
      </div>

      {/* Upload Section */}
      <Card title="Upload Excel File" style={{ marginBottom: 24 }}>
        <div
          {...getRootProps()}
          className={`upload-area ${isDragActive ? 'dragover' : ''}`}
          style={{ marginBottom: 16 }}
        >
          <input {...getInputProps()} />
          <div style={{ textAlign: 'center' }}>
            <FileExcelOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
            <div>
              {isDragActive ? (
                <Text>Drop the Excel file here...</Text>
              ) : (
                <>
                  <Text strong>Drag & drop an Excel file here, or click to select</Text>
                  <br />
                  <Text type="secondary">Supports .xlsx and .xls files (Max 10MB)</Text>
                </>
              )}
            </div>
          </div>
        </div>

        {selectedFile && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{selectedFile.name}</Text>
                <br />
                <Text type="secondary">
                  Size: {formatFileSize(selectedFile.size)} | 
                  Type: {selectedFile.type || 'Unknown'}
                </Text>
              </div>
              <Space>
                <Button type="text" onClick={handleClearFile}>
                  Remove
                </Button>
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                  loading={uploading}
                  onClick={handleUpload}
                >
                  Upload & Process
                </Button>
              </Space>
            </div>
            
            {uploading && (
              <div style={{ marginTop: 16 }}>
                <Progress percent={uploadProgress} status="active" />
                <Text type="secondary">Processing file...</Text>
              </div>
            )}
          </Card>
        )}

        {/* Upload Instructions */}
        <Alert
          message="Upload Instructions"
          description={
            <div>
              <p><strong>Excel File Format Requirements:</strong></p>
              <ul>
                <li>The file should contain columns matching your data structure</li>
                <li>{isReservationUpload ? 'Reservation code is required and must be unique' : 'Unit Code is required and must be unique'}</li>
                <li>Date columns should be in proper Excel date format</li>
                <li>Numeric fields (prices, amounts, etc.) should contain only numbers</li>
                <li>First row should contain column headers</li>
              </ul>
              <p><strong>Supported Columns:</strong> {isReservationUpload 
                ? 'Reservation code, SR, Reservation Date, Client Name, Nationality, ID/Passport, Date of ID, Serial Num. of ID, Address, Email, Home Number, Mobile Number, Unit Code, Payment, Deposit, Currency, Payment Method, Number of Deposit/Transfer, Date of Deposit/Transfer, Bank Name, Sales, Sales Manager, Senior Sales Manager, Cancel'
                : 'DATE, UNIT CODE, Project, Type, Sales Status, name, Block no, Plot, Floor, unit no, BUA, Garden, Roof, Outdoor, unit price, Contract price, price installment, Sales Agent, broker NAM, SOURCE, Address, Phone Number, Maintenance, Parking, Year, delivery Date, Grace Period, Contract Finishing, COMMENTS'
              }</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card title="Upload Results" style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>Total Rows: {uploadResult.totalRows}</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>Valid Rows: {uploadResult.validRows}</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong>Successfully Imported: {uploadResult.successCount}</Text>
              </div>
              {uploadResult.errorCount > 0 && (
                <div>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  <Text strong style={{ color: '#ff4d4f' }}>Errors: {uploadResult.errorCount}</Text>
                </div>
              )}
            </Space>
          </div>

          <Alert
            message={uploadResult.message}
            type={uploadResult.errorCount > 0 ? 'warning' : 'success'}
            showIcon
          />

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={4}>Import Errors</Title>
              <Table
                columns={errorColumns}
                dataSource={uploadResult.errors}
                pagination={false}
                size="small"
                rowKey={isReservationUpload ? "reservationCode" : "unitCode"}
              />
            </div>
          )}
        </Card>
      )}

      {/* Upload History */}
      <Card 
        title={
          <Space>
            <HistoryOutlined />
            Upload History
          </Space>
        }
      >
        {uploadHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">No upload history available</Text>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={uploadHistory}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<FileExcelOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title={item.filename}
                  description={
                    <div>
                      <Text type="secondary">
                        Imported {item.recordCount} records on {formatDate(item.importedAt)}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default UploadData; 