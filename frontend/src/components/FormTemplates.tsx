import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  message, 
  Popconfirm, 
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { formTemplatesApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

interface FormTemplate {
  id: number;
  name: string;
  description?: string;
  templateType: string;
  fields: any[];
  layout?: any;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const FormTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await formTemplatesApi.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      } else {
        message.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      message.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefault = async () => {
    setLoading(true);
    try {
      const response = await formTemplatesApi.createDefaultTemplate();
      if (response.success) {
        message.success(response.message || 'Default template created successfully');
        fetchTemplates();
      } else {
        message.error('Failed to create default template');
      }
    } catch (error) {
      console.error('Error creating default template:', error);
      message.error('Failed to create default template');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: FormTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      templateType: template.templateType
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await formTemplatesApi.deleteTemplate(id);
      if (response.success) {
        message.success('Template deleted successfully');
        fetchTemplates();
      } else {
        message.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingTemplate) {
        // Update existing template
        const response = await formTemplatesApi.updateTemplate(editingTemplate.id, values);
        if (response.success) {
          message.success('Template updated successfully');
          fetchTemplates();
          setModalVisible(false);
          setEditingTemplate(null);
          form.resetFields();
        } else {
          message.error('Failed to update template');
        }
      } else {
        // Create new template (basic version)
        const templateData = {
          ...values,
          fields: [],
          layout: { sections: [], direction: 'ltr', printFormat: 'A4' },
          createdBy: 'Admin'
        };
        
        const response = await formTemplatesApi.createTemplate(templateData);
        if (response.success) {
          message.success('Template created successfully');
          fetchTemplates();
          setModalVisible(false);
          form.resetFields();
        } else {
          message.error('Failed to create template');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      message.error('Failed to save template');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Type',
      dataIndex: 'templateType',
      key: 'templateType',
      render: (type: string) => (
        <Tag color={type === 'reservation' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Fields Count',
      key: 'fieldsCount',
      render: (record: FormTemplate) => (
        <span>{record.fields?.length || 0} fields</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
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
      width: 200,
      render: (record: FormTemplate) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              Modal.info({
                title: 'Template Details',
                width: 600,
                content: (
                  <div style={{ marginTop: 16 }}>
                    <p><strong>Name:</strong> {record.name}</p>
                    <p><strong>Description:</strong> {record.description || 'No description'}</p>
                    <p><strong>Type:</strong> {record.templateType}</p>
                    <p><strong>Fields:</strong> {record.fields?.length || 0}</p>
                    <p><strong>Created by:</strong> {record.createdBy || 'Unknown'}</p>
                    <p><strong>Created:</strong> {new Date(record.createdAt).toLocaleString()}</p>
                  </div>
                ),
              });
            }}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            <ToolOutlined /> Form Templates
          </Title>
          <Space>
            {templates.length === 0 && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateDefault}
                loading={loading}
              >
                Create Default Template
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              New Template
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} templates`,
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? 'Edit Template' : 'Create New Template'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingTemplate ? 'Update' : 'Create'}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            templateType: 'reservation'
          }}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={3} 
              placeholder="Enter template description" 
            />
          </Form.Item>

          <Form.Item
            name="templateType"
            label="Template Type"
            rules={[{ required: true, message: 'Please select template type' }]}
          >
            <Select placeholder="Select template type">
              <Select.Option value="reservation">Reservation</Select.Option>
              <Select.Option value="contract">Contract</Select.Option>
              <Select.Option value="agreement">Agreement</Select.Option>
              <Select.Option value="receipt">Receipt</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FormTemplates;