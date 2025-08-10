import React, { useState, useEffect } from 'react';
// Fixed FileImageOutlined error
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
  EyeOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { formTemplatesApi, formGenerationApi } from '../services/api';
import jsPDF from 'jspdf';

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
  const [formPreviewVisible, setFormPreviewVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState<GeneratedForm | null>(null);
  const [editableFormData, setEditableFormData] = useState<any>(null);

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

  const exportToPDF = () => {
    if (!populatedForm) {
      message.error('No form data to export!');
      return;
    }
  
    const doc = new jsPDF();
    let y = 20; // Initial Y position
  
    // Title
    doc.setFontSize(18);
    doc.text(populatedForm.name, 105, y, { align: 'center' });
    y += 10;
  
    // Sub-header
    doc.setFontSize(12);
    doc.text(`Reservation: ${populatedForm.populatedWith.reservationCode} | Unit: ${populatedForm.populatedWith.unitCode}`, 105, y, { align: 'center' });
    y += 15;
  
    // Fields
    doc.setFontSize(12);
    populatedForm.fields.forEach((field: any) => {
      if (y > 280) { // Check for page break
        doc.addPage();
        y = 20;
      }
      doc.text(`${field.label}:`, 14, y);
      doc.text(String(field.value || '-'), 70, y);
      y += 10;
    });
  
    doc.save(`${populatedForm.populatedWith.reservationCode}.pdf`);
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

  const handlePreviewForm = async (form: GeneratedForm) => {
    try {
      setLoading(true);
      const response = await formGenerationApi.getForm(form.id);
      if (response.success) {
        setSelectedForm(form);
        setEditableFormData(typeof response.data.formData === 'string' ? JSON.parse(response.data.formData) : response.data.formData);
        setFormPreviewVisible(true);
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
      message.error('Failed to load form details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = async (form: GeneratedForm) => {
    try {
      setLoading(true);
      const response = await formGenerationApi.getForm(form.id);
      if (response.success) {
        setSelectedForm(form);
        setEditableFormData(typeof response.data.formData === 'string' ? JSON.parse(response.data.formData) : response.data.formData);
        setEditModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
      message.error('Failed to load form details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async () => {
    if (!selectedForm || !editableFormData) return;
    
    try {
      setLoading(true);
      const response = await formGenerationApi.updateForm(selectedForm.id, JSON.stringify(editableFormData));
      if (response.success) {
        message.success('Form updated successfully');
        setEditModalVisible(false);
        setSelectedForm(null);
        setEditableFormData(null);
        fetchGeneratedForms();
      }
    } catch (error) {
      console.error('Error updating form:', error);
      message.error('Failed to update form');
    } finally {
      setLoading(false);
    }
  };

     const handleFieldChange = (fieldIndex: number, newValue: any) => {
     if (!editableFormData) return;
     
     const updatedFormData = { ...editableFormData };
     updatedFormData.fields[fieldIndex].value = newValue;
     setEditableFormData(updatedFormData);
   };

       const handlePrintPreview = () => {
      // Get the form content
      const formContent = document.getElementById('form-preview-content');
      if (!formContent) {
        message.error('Form content not found');
        return;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        message.error('Please allow popups to print the form');
        return;
      }

      // Create the print HTML with exact same styling as the preview
      const printHTML = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>Form Print</title>
          <style>
            @media print {
              html, body {
                margin: 0; 
                padding: 0; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none !important; }
            }
             body {
               font-family: 'Amiri', Arial, sans-serif;
               direction: rtl;
               text-align: right;
               margin: 0;
               padding: 0;
               font-size: 15px;
               line-height: 1.4;
               background-color: white;
             }
             .form-content {
               background: white;
               padding: 16px;
               border: 1px solid #d9d9d9;
               font-size: 15px;
               line-height: 1.4;
               direction: rtl;
               text-align: right;
               font-family: 'Amiri', Arial, sans-serif;
               box-sizing: border-box;
               display: flex;
               flex-direction: column;
               page-break-inside: avoid;
               margin: 0;
               min-height: 100vh; /* extend border to bottom of page */
             }
             .form-header {
               display: flex;
               justify-content: space-between;
               align-items: center;
               border-bottom: 2px solid #1C4584;
               padding-bottom: 6px;
               margin-bottom: 8px;
             }
             .form-title {
               text-align: center;
               font-size: 22px;
               font-weight: bold;
               margin: 0;
               font-family: 'Amiri', Arial, sans-serif;
               color: #1C4584;
             }
             .form-description {
               font-size: 13px;
               text-align: center;
               color: #666;
             }
                          .form-info {
                display: flex;
                justify-content: space-between;
               margin-bottom: 8px;
               font-size: 12px;
                padding: 0 2px;
                color: #666;
              }
            .section-title {
              font-weight: bold;
               font-size: 16px;
              color: #1C4584;
              border-right: 2px solid #1C4584;
              padding-right: 3px;
              margin-bottom: 3px;
              font-family: 'Amiri', Arial, sans-serif;
            }
            .field-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              align-items: center;
            }
            .field-label {
              font-weight: bold;
              font-size: 13.5px;
              flex-basis: 40%;
              color: #333;
            }
            .field-value {
              border-bottom: 1px solid #ddd;
              padding: 1px 2px;
              font-size: 13.5px;
              flex-basis: 60%;
              text-align: right;
               direction: rtl;
               unicode-bidi: plaintext; /* preserve natural direction of mixed LTR/RTL values */
              color: #555;
            }
            .signature-field {
              margin-bottom: 2px;
            }
            .signature-label {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 1px;
              color: #333;
            }
            .signature-value {
              border-bottom: 1px solid #1C4584;
              min-height: 10px;
              padding: 1px;
            }
            .terms-section {
              font-size: 12.5px;
              border: 1px solid #ddd;
              padding: 10px;
              background-color: #f8f9fa;
              line-height: 1.35;
              text-align: right;
              direction: rtl;
               column-count: 2;
              column-gap: 12px;
              max-height: none;
              overflow: visible;
            }
            .final-signatures {
              border-top: 2px solid #1C4584;
              padding-top: 2px;
               margin-top: auto; /* push to bottom of page */
              display: flex;
              justify-content: space-around;
              text-align: center;
            }
             .sections-grid {
               column-count: 2; /* Masonry-style columns eliminate vertical gaps */
               column-gap: 6px;
               margin-bottom: 6px;
             }
             .section-card {
               border: 1px solid #e5e5e5;
               padding: 4px;
               border-radius: 2px;
               display: inline-block; /* required for column layout */
               width: 100%;
               overflow: hidden;
               break-inside: avoid;
               page-break-inside: avoid;
               margin-bottom: 6px;
             }
             .section-card .section-body {
               overflow: hidden;
            }
            .signature-box {
              border-bottom: 1px solid #1C4584;
              height: 15px;
              margin-bottom: 1px;
            }
            .signature-text {
               font-size: 9px;
              color: #1C4584;
            }
            .ant-row {
              display: flex;
              flex-wrap: wrap;
              margin-right: -3px;
              margin-left: -3px;
            }
            .ant-col {
              padding-right: 3px;
              padding-left: 3px;
            }
            .ant-col-12 {
              flex: 0 0 50%;
              max-width: 50%;
            }
            .ant-col-8 {
              flex: 0 0 33.333333%;
              max-width: 33.333333%;
            }
            .ant-typography {
              margin: 0;
            }
            .ant-typography h3 {
              margin: 0;
              font-family: 'Amiri', Arial, sans-serif;
              font-size: 22px;
              color: #1C4584;
            }
            .ant-typography h4 {
              margin: 0;
              font-family: 'Amiri', Arial, sans-serif;
              font-size: 16px;
              color: #1C4584;
            }
            .ant-typography p {
              margin: 0 0 2px 0;
            }
            @page {
              size: A4;
              margin: 6mm;
            }
          </style>
        </head>
        <body>
          <div class="form-content">
            ${formContent.innerHTML}
          </div>
          <script>
             (function() {
               function mmToPx(mm) { return mm * (96 / 25.4); }
               function fitToOnePage() {
                 var content = document.querySelector('.form-content');
                 if (!content) return;
                 content.style.transform = 'none';
                 content.style.transformOrigin = 'top right';
                 var pageHeightPx = mmToPx(297 - 16); // A4 height minus @page margins
                 // Use scrollHeight for more accurate total height
                 var contentHeight = content.scrollHeight;
                 var scale = Math.min(1, (pageHeightPx - 4) / contentHeight); // small 4px safety pad
                 if (scale < 1) {
                   content.style.transform = 'scale(' + scale + ')';
                 }
               }
            window.onload = function() {
                 // Give the browser a tick to layout columns then fit
                 setTimeout(function() {
                   fitToOnePage();
                   setTimeout(function() { window.print(); }, 20);
                 }, 20);
                 window.onafterprint = function() { window.close(); };
               };
             })();
          </script>
        </body>
        </html>
      `;

      // Write the content to the new window
      printWindow.document.write(printHTML);
      printWindow.document.close();
    };

     const handlePrintForm = async () => {
     // New PDF Export Logic - works with both populatedForm and editableFormData
     const formData = editableFormData || populatedForm;
     if (!formData) {
         message.error("No data to export.");
         return;
     }

     try {
         const fontResponse = await fetch('/fonts/Amiri-Regular.ttf');
         if (!fontResponse.ok) {
             throw new Error('Font file not found');
         }
         const font = await fontResponse.arrayBuffer();
         const fontBase64 = btoa(new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), ''));

         const doc = new jsPDF();

         doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
         doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
         doc.setFont('Amiri');

         let y = 20;
         doc.setFontSize(18);
         doc.text(formData.name, 105, y, { align: 'center', lang: 'ar' });
         y += 10;

         doc.setFontSize(12);
         const reservationCode = selectedForm?.reservationCode || formData.populatedWith?.reservationCode || 'N/A';
         const unitCode = selectedForm?.unitCode || formData.populatedWith?.unitCode || 'N/A';
         const subHeader = `Reservation: ${reservationCode} | Unit: ${unitCode}`;
         doc.text(subHeader, 105, y, { align: 'center', lang: 'ar' });
         y += 15;

         doc.setFontSize(12);
         formData.fields.forEach((field: any) => {
             if (y > 280) {
                 doc.addPage();
                 y = 20;
             }
             // Use RTL text rendering
             const fieldText = `${field.label}: ${String(field.value || '-')}`;
             doc.text(fieldText, 195, y, { align: 'right', lang: 'ar' });
             y += 10;
         });

         const fileName = `${reservationCode || 'form'}.pdf`;
         doc.save(fileName);

     } catch (error) {
         console.error("PDF generation failed:", error);
         message.error("Failed to generate PDF. Could not load font.");
     }
   };

                                               const signatureFieldStyle: React.CSSProperties = {
               marginBottom: '2px'
             };

     const signatureLabelStyle: React.CSSProperties = {
       fontWeight: 'bold',
       fontSize: '8px',
       marginBottom: '1px',
       color: '#333'
     };

          const signatureValueStyle: React.CSSProperties = {
        borderBottom: '1px solid #1C4584',
        minHeight: '10px',
        padding: '1px'
      };

  const renderFieldsBySection = (sections: string[], options?: { compact?: boolean }) => {
    return editableFormData.fields?.filter((field: any) => 
      sections.some(sec => 
        field.section === sec || 
        field.id?.toLowerCase().includes(sec) || 
        field.label?.toLowerCase().includes(sec)
      )
    ).map((field: any, index: number) => (
      <div key={index} style={options?.compact ? fieldRowStyleCompact : fieldRowStyle}>
        <div style={fieldLabelStyle}>{field.label}:</div>
        <div style={fieldValueStyle}>{field.value || ''}</div>
      </div>
    ));
  };
           const sectionTitleStyle: React.CSSProperties = {
      fontFamily: '"Amiri", Arial, sans-serif',
      fontWeight: 'bold',
      fontSize: '11px',
      color: '#1C4584',
      borderRight: '2px solid #1C4584',
      paddingRight: '3px',
      marginBottom: '3px'
    };

               const fieldRowStyle: React.CSSProperties = {
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1px',
          alignItems: 'center'
        };

        const fieldRowStyleCompact: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0px',
          alignItems: 'center'
        };

       const fieldLabelStyle: React.CSSProperties = {
      fontWeight: 'bold',
      fontSize: '9px',
      flexBasis: '40%',
      color: '#333'
    };

               const fieldValueStyle: React.CSSProperties = {
          borderBottom: '1px solid #ddd',
          padding: '1px 2px',
          fontSize: '9px',
          flexBasis: '60%',
          textAlign: 'right',
          direction: 'rtl',
          unicodeBidi: 'plaintext',
          color: '#555'
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
            onClick={() => handlePreviewForm(record)}
            loading={loading}
          >
            Preview
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditForm(record)}
            loading={loading}
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
                        <Button 
          icon={<FilePdfOutlined />}
          onClick={handlePrintForm}
      >
          Export to PDF
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

             {/* Form Preview Modal */}
       <Modal
         title="Form Preview & Print"
         open={formPreviewVisible}
         onCancel={() => {
           setFormPreviewVisible(false);
           setSelectedForm(null);
           setEditableFormData(null);
         }}
         footer={[
           <Button 
             key="print" 
             type="primary" 
             icon={<PrinterOutlined />}
             onClick={handlePrintForm}
           >
             Export to PDF
           </Button>,
                       <Button 
              key="print-preview" 
              icon={<PrinterOutlined />}
              onClick={handlePrintPreview}
            >
              Print Preview
            </Button>,
           <Button key="close" onClick={() => {
             setFormPreviewVisible(false);
             setSelectedForm(null);
             setEditableFormData(null);
           }}>
             Close
           </Button>
         ]}
         width={1000}
       >
                                                                       {editableFormData && (
             <div id="form-preview-content" style={{ 
               backgroundColor: 'white', 
               padding: '10px', 
               border: '1px solid #d9d9d9',
                fontSize: '12px',
                lineHeight: '1.3',
               direction: 'rtl',
               textAlign: 'right',
               fontFamily: '"Amiri", Arial, sans-serif',
               maxHeight: 'calc(100vh - 200px)',
               overflow: 'auto'
             }}>
                           {/* Form Header */}
                                 <div style={{ 
                    display: 'flex', 
                  justifyContent: 'space-between',
                    alignItems: 'center', 
                  borderBottom: '2px solid #1C4584',
                  paddingBottom: '6px',
                  marginBottom: '8px'
                }}>
                 <div style={{ textAlign: 'left', flex: '0 0 100px' }}>
                     <img 
                       src="/images/logo.png" 
                       alt="Company Logo"
                     style={{ maxHeight: '40px' }}
                     />
                   </div>
                 <div style={{ textAlign: 'center', flex: '1' }}>
                                     <Title level={3} style={{ margin: 0, fontFamily: '"Amiri", Arial, sans-serif', fontSize: '14px', color: '#1C4584' }}>{editableFormData.name}</Title>
                    <Text style={{ fontSize: '9px', color: '#666' }}>{editableFormData.description}</Text>
                 </div>
                 <div style={{ textAlign: 'right', flex: '0 0 100px' }}></div>
               </div>

                          {/* Form Info Bar removed per requirement */}

                            {/* Form Sections - Grid layout for square formation */}
                            <div className="sections-grid">
                  <div className="section-card" style={{ padding: 4 }}>
                       <Title level={4} style={sectionTitleStyle}>معلومات أساسية</Title>
                    <div className="section-body">{renderFieldsBySection(['basic', 'reservation', 'clientCode'], { compact: true })}</div>
                     </div>
                  <div className="section-card" style={{ padding: 4 }}>
                       <Title level={4} style={sectionTitleStyle}>معلومات شخصية</Title>
                    <div className="section-body">{renderFieldsBySection(['personal', 'client', 'nationality', 'address', 'email', 'mobile', 'home', 'phone'], { compact: true })}</div>
                         </div>
                  <div className="section-card" style={{ padding: 4 }}>
                       <Title level={4} style={sectionTitleStyle}>معلومات الوحدة</Title>
                    <div className="section-body">{renderFieldsBySection(['unit', 'block', 'floor', 'bua'], { compact: true })}</div>
                         </div>
                  <div className="section-card" style={{ padding: 4 }}>
                       <Title level={4} style={sectionTitleStyle}>معلومات الدفع</Title>
                    <div className="section-body">{renderFieldsBySection(['payment', 'deposit', 'currency', 'bankName', 'depositTransfer', 'paymentType', 'priceInstallment'], { compact: true })}</div>
                       </div>
                </div>

                          {/* Terms and Conditions */}
                            <div style={{ marginBottom: '2px' }}>
                 <Title level={4} style={sectionTitleStyle}>الشروط والأحكام</Title>
                                <div className="terms-section" style={{ 
                   fontSize: '10px',
                   border: '1px solid #ddd',
                   padding: '6px',
                   backgroundColor: '#f8f9fa',
                   lineHeight: '1.3',
                   textAlign: 'right',
                   direction: 'rtl'
                 }}>
                 {(() => {
                   const termsField = editableFormData.fields?.find((field: any) => 
                     field.id === 'terms' || 
                     field.label?.includes('الشروط') || 
                     field.label?.includes('الأحكام')
                   );
                   
                   if (termsField?.value) {
                      const normalized = String(termsField.value).replace(/\r/g, '');
                      let parts = normalized.split(/\n{2,}|\n\s*[-•]\s+|\n\s*\d+\.\s+/);
                      if (!parts || parts.length <= 1) {
                        parts = normalized.split(/\n+/);
                      }
                      parts = parts.map((p: string) => p.trim()).filter((p: string) => p.length > 0);
                      return parts.map((term: string, index: number) => (
                        <p key={index} style={{ margin: '0 0 4px 0', textAlign: 'right', direction: 'rtl' }}>
                          {term}
                        </p>
                     ));
                   } else {
                     // Fallback to default terms if not found
                     const defaultTerms = [
                       "1. يتم التوقيع على العقد وسداد باقى مقدم الحجز خلال ثلاثة أيام عمل بحد أقصى من تاريخ هذه الاستمارة ، وفى حالة عدم السداد او التوقيع خلال هذه المدة تعتبر إستمارة الحجز لاغيه ويحق للشركة إعادة طرح الوحدة للبيع ، ولا يحق له الرجوع على الشركة حاليا او مستقبلا بشأن اعادة بيع الوحدة.",
                       "2. فى حاله إمتناعى عن توقيع العقد الإبتدائى فى الموعد المحدد يعتبر ذلك عدولا نهائيا من جانبى عن الحجز و تكون هذه الإستمارة كأن لم تكن دون الحاجة إلى التنبيه أو إنذار أو حكم قضائى و يحق للشركه بيع الوحدة للغير دون الإعتداد بهذا الحجز.",
                       "3. يعتبر الحجز لاغيا وكأن لم يكن دون الحاجة إلى تنبية أو إنذار أو حكم قضائى فى حاله إرتداد شيك دفعة الحجز.",
                       "4. تعتبر هذة الإستمارة جزء مكمل للعقد و يعتبر توقيعى على هذه الإستمارة موافقه على كافة شروطها.",
                       "5. أقر بأن عنوان المراسلة الثابت بهذه الإستمارة هو موطنى المختار الذى يصح عليه إخطارى بكافة المراسلات.",
                       "6. يعتبر هذا الطلب غير منتج لأثاره القانونية ما لم يكن مختوم بخاتم الشركة و موقعا عليه من الموظف المسئول و المفوض من قبل الإدارة و مرفقا به الإيصال الدال على سداد مقدم الحجز الصادر من الشركة.",
                       "7. فى حالة عدم تحصيل مبلغ جدية الحجز المذكور أعلاه تكون هذه الإستمارة كأن لم تكن دون الحاجة إلى التنبيه أو إنذار أو حكم قضائى و يحق للشركه بيع الوحدة للغير دون الإعتداد بهذا الحجز.",
                       "8. يتم سداد المبلغ المتبقى للوحدة على أقساط بالاضافة الى مبلغ وديعة الصيانة طبقا لجدول الاقساط النهائى والمتفق علية والمرفق بهذه الاستمارة."
                     ];
                     
                                                                  return defaultTerms.map((term: string, index: number) => (
                         <p key={index} style={{ margin: '0 0 4px 0', textAlign: 'right', direction: 'rtl' }}>
                           {term}
                         </p>
                       ));
                   }
                 })()}
               </div>
             </div>

                          {/* Staff Signatures - moved after terms, values left blank for manual signing */}
                            <div style={{ marginBottom: '4px' }}>
                 <Title level={4} style={sectionTitleStyle}>توقيعات الموظفين</Title>
                 <Row gutter={[24, 8]}>
                    {editableFormData.fields?.filter((field: any) => 
                    field.section === 'signatures' || field.id?.includes('sales') || field.id?.includes('manager') || field.id?.includes('operations')
                    ).map((field: any, index: number) => (
                    <Col span={12} key={index} style={{ marginBottom: '6px' }}>
                      <div style={signatureFieldStyle}>
                        <div style={signatureLabelStyle}>{field.label}:</div>
                        <div style={signatureValueStyle}></div>
                        </div>
                    </Col>
                  ))}
                </Row>
             </div>

                                                   {/* Final Signatures */}
                            <div className="final-signatures" style={{ 
                 borderTop: '2px solid #1C4584',
                 paddingTop: '2px',
                 display: 'grid',
                 gridTemplateColumns: 'repeat(4, 1fr)',
                 gap: '8px',
                 justifyContent: 'space-around',
                 textAlign: 'center'
               }}>
                <div>
                   <div style={{ borderBottom: '1px solid #1C4584', height: '22px', marginBottom: '4px' }}></div>
                   <Text strong style={{ fontSize: '9px', color: '#1C4584' }}>توقيع العميل</Text> / <Text style={{ fontSize: '9px', color: '#666' }}>Client Signature</Text>
                  </div>
                                <div>
                    <div style={{ borderBottom: '1px solid #1C4584', height: '22px', marginBottom: '4px' }}></div>
                    <Text strong style={{ fontSize: '9px', color: '#1C4584' }}>التاريخ</Text> / <Text style={{ fontSize: '9px', color: '#666' }}>Date</Text>
                   </div>
                 <div>
                    <div style={{ borderBottom: '1px solid #1C4584', height: '22px', marginBottom: '4px' }}></div>
                    <Text strong style={{ fontSize: '9px', color: '#1C4584' }}>ختم الشركة</Text> / <Text style={{ fontSize: '9px', color: '#666' }}>Company Seal</Text>
                   </div>
                 <div>
                    <div style={{ borderBottom: '1px solid #1C4584', height: '22px', marginBottom: '4px' }}></div>
                    <Text strong style={{ fontSize: '9px', color: '#1C4584' }}>توقيع المسئول</Text> / <Text style={{ fontSize: '9px', color: '#666' }}>Staff Signature</Text>
                   </div>
                </div>
              
          </div>
        )}
      </Modal>

      {/* Form Edit Modal */}
      <Modal
        title="Edit Generated Form"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedForm(null);
          setEditableFormData(null);
        }}
        onOk={handleSaveForm}
        okText="Save Changes"
        confirmLoading={loading}
        width={900}
      >
        {editableFormData && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Template: </Text>
              <Text>{editableFormData.name}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Description: </Text>
              <Text>{editableFormData.description}</Text>
            </div>
            <Divider />
            <Title level={5}>Edit Form Fields:</Title>
            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              {editableFormData.fields?.map((field: any, index: number) => (
                <Row key={index} style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                  <Col span={8}>
                    <Text strong>{field.label}:</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {field.type} {field.source ? `(${field.source})` : ''}
                    </Text>
                  </Col>
                  <Col span={16}>
                    {field.type === 'text' && (
                      <Input
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, parseFloat(e.target.value) || 0)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                      />
                    )}
                    {field.type === 'email' && (
                      <Input
                        type="email"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === 'tel' && (
                      <Input
                        type="tel"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {(field.id === 'terms' || field.label?.includes('الشروط')) && (
                      <Input.TextArea
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        placeholder="Enter terms and conditions / أدخل الشروط والأحكام"
                        rows={10}
                        style={{ fontSize: '12px', direction: 'rtl', textAlign: 'right' }}
                      />
                    )}
                    {(!field.type || field.type === 'textarea') && !(field.id === 'terms' || field.label?.includes('الشروط')) && (
                      <Input.TextArea
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                      />
                    )}
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