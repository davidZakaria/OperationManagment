import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Steps, 
  Button, 
  Space, 
  message, 
  Typography,
  Select,
  Input,
  Table,
  Divider,
  Form,
  Row,
  Col,
  Tag,
  Modal,
  Alert
} from 'antd';
import { 
  FileTextOutlined, 
  SearchOutlined,
  FormOutlined,
  PrinterOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { formTemplatesApi, formGenerationApi } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

interface Reservation {
  id: number;
  reservationCode: string;
  clientName: string;
  unitCode: string;
  reservationDate: string;
  mobileNumber: string;
}

interface FormTemplate {
  id: number;
  name: string;
  description?: string;
  templateType: string;
  fields: any[];
}

interface GeneratedForm {
  id: number;
  templateId: number;
  reservationCode: string;
  unitCode: string;
  formData: any;
  status: string;
  createdAt: string;
  template: { name: string; templateType: string };
}

const GenerateForms: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [generatedForms, setGeneratedForms] = useState<GeneratedForm[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [populatedForm, setPopulatedForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchGeneratedForms();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchReservations();
    } else {
      setReservations([]);
    }
  }, [searchQuery]);

  const fetchTemplates = async () => {
    try {
      const response = await formTemplatesApi.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      message.error('Failed to fetch templates');
    }
  };

  const searchReservations = async () => {
    try {
      const response = await formGenerationApi.searchReservations({ search: searchQuery, limit: 10 });
      if (response.success) {
        setReservations(response.data);
      }
    } catch (error) {
      console.error('Error searching reservations:', error);
      message.error('Failed to search reservations');
    }
  };

  const fetchGeneratedForms = async () => {
    try {
      const response = await formGenerationApi.getForms({ limit: 20 });
      if (response.success) {
        setGeneratedForms(response.data);
      }
    } catch (error) {
      console.error('Error fetching generated forms:', error);
    }
  };

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(1);
  };

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    populateTemplate(reservation);
  };

  const populateTemplate = async (reservation: Reservation) => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      const response = await formGenerationApi.populateTemplate(
        selectedTemplate.id,
        reservation.reservationCode,
        reservation.unitCode
      );
      
      if (response.success) {
        setPopulatedForm(response.data);
        setCurrentStep(2);
        message.success('Form populated successfully');
      } else {
        message.error('Failed to populate form');
      }
    } catch (error) {
      console.error('Error populating template:', error);
      message.error('Failed to populate form');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForm = async () => {
    if (!selectedTemplate || !selectedReservation) return;
    
    setLoading(true);
    try {
      const response = await formGenerationApi.generateForm(
        selectedTemplate.id,
        selectedReservation.reservationCode,
        selectedReservation.unitCode,
        'Admin User'
      );
      
      if (response.success) {
        message.success('Form generated successfully');
        fetchGeneratedForms();
        setCurrentStep(3);
      } else {
        message.error('Failed to generate form');
      }
    } catch (error) {
      console.error('Error generating form:', error);
      message.error('Failed to generate form');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setSelectedTemplate(null);
    setSelectedReservation(null);
    setPopulatedForm(null);
    setSearchQuery('');
    setReservations([]);
  };

  const handleMarkPrinted = async (formId: number) => {
    try {
      const response = await formGenerationApi.markPrinted(formId);
      if (response.success) {
        message.success('Form marked as printed');
        fetchGeneratedForms();
      } else {
        message.error('Failed to mark form as printed');
      }
    } catch (error) {
      console.error('Error marking form as printed:', error);
      message.error('Failed to mark form as printed');
    }
  };

  const reservationColumns = [
    {
      title: 'Reservation Code',
      dataIndex: 'reservationCode',
      key: 'reservationCode',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
    },
    {
      title: 'Date',
      dataIndex: 'reservationDate',
      key: 'reservationDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: Reservation) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => handleReservationSelect(record)}
        >
          Select
        </Button>
      ),
    },
  ];

  const formsColumns = [
    {
      title: 'Template',
      key: 'template',
      render: (record: GeneratedForm) => record.template?.name || 'Unknown',
    },
    {
      title: 'Reservation Code',
      dataIndex: 'reservationCode',
      key: 'reservationCode',
    },
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'printed' ? 'green' : status === 'completed' ? 'blue' : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: GeneratedForm) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              // TODO: Implement preview functionality
              message.info('Preview functionality coming soon');
            }}
          >
            Preview
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              // TODO: Implement edit functionality
              message.info('Edit functionality coming soon');
            }}
          >
            Edit
          </Button>
          {record.status !== 'printed' && (
            <Button
              icon={<PrinterOutlined />}
              size="small"
              type="primary"
              onClick={() => handleMarkPrinted(record.id)}
            >
              Print
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>Step 1: Select Template</Title>
            <Row gutter={[16, 16]}>
              {templates.map((template) => (
                <Col xs={24} sm={12} md={8} key={template.id}>
                  <Card
                    hoverable
                    onClick={() => handleTemplateSelect(template)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <FileTextOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                      <Title level={5}>{template.name}</Title>
                      <Text type="secondary">{template.description}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="blue">{template.templateType}</Tag>
                        <Text type="secondary">
                          {template.fields?.length || 0} fields
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            {templates.length === 0 && (
              <Alert
                message="No templates available"
                description="Please create a template first in the Form Templates section."
                type="warning"
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Step 2: Select Reservation</Title>
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search by reservation code, client name, or unit code"
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 400 }}
              />
            </Space>
            
            {reservations.length > 0 && (
              <Table
                columns={reservationColumns}
                dataSource={reservations}
                rowKey="id"
                pagination={false}
                size="small"
              />
            )}
            
            {searchQuery && reservations.length === 0 && (
              <Alert
                message="No reservations found"
                description="Try searching with different keywords."
                type="info"
              />
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Step 3: Review & Generate</Title>
            {populatedForm && (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Card size="small" title="Template Info">
                      <p><strong>Name:</strong> {populatedForm.name}</p>
                      <p><strong>Type:</strong> {populatedForm.templateType}</p>
                      <p><strong>Fields:</strong> {populatedForm.fields?.length}</p>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="Data Info">
                      <p><strong>Client:</strong> {populatedForm.populatedWith?.clientName}</p>
                      <p><strong>Reservation:</strong> {populatedForm.populatedWith?.reservationCode}</p>
                      <p><strong>Unit:</strong> {populatedForm.populatedWith?.unitCode}</p>
                    </Card>
                  </Col>
                </Row>
                
                <Space style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<FormOutlined />}
                    onClick={handleGenerateForm}
                    loading={loading}
                  >
                    Generate Form
                  </Button>
                  <Button onClick={() => setPreviewVisible(true)}>
                    Preview Data
                  </Button>
                </Space>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>Form Generated Successfully!</Title>
            <Space>
              <Button type="primary" onClick={handleStartOver}>
                Generate Another Form
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                View All Generated Forms
              </Button>
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>
          <PrinterOutlined /> Generate Forms
        </Title>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="Select Template" icon={<FileTextOutlined />} />
          <Step title="Choose Reservation" icon={<SearchOutlined />} />
          <Step title="Review & Generate" icon={<FormOutlined />} />
          <Step title="Complete" icon={<PrinterOutlined />} />
        </Steps>

        {renderStepContent()}

        {currentStep > 0 && currentStep < 3 && (
          <div style={{ marginTop: 24 }}>
            <Button onClick={() => setCurrentStep(currentStep - 1)}>
              Previous
            </Button>
          </div>
        )}
      </Card>

      {/* Generated Forms Table */}
      <Card style={{ marginTop: 24 }} title="Recently Generated Forms">
        <Table
          columns={formsColumns}
          dataSource={generatedForms}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} forms`,
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Form Data Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {populatedForm && (
          <div>
            <Title level={5}>Populated Fields:</Title>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {populatedForm.fields?.map((field: any, index: number) => (
                <Row key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f5f5f5' }}>
                  <Col span={8}>
                    <strong>{field.label}:</strong>
                  </Col>
                  <Col span={16}>
                    {field.value || <Text type="secondary">Empty</Text>}
                  </Col>
                </Row>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GenerateForms;