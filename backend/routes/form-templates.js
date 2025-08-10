const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Default template for Jamila North Coast Reservation Form
const DEFAULT_TEMPLATE = {
  name: "Jamila North Coast Reservation Form",
  description: "Standard reservation form for Jamila North Coast project",
  templateType: "reservation",
  fields: [
    // Header Section
    { id: "projectTitle", type: "text", label: "Project Title", value: "استمارة طلب حجز وحدة سكنية بمشروع Jamila North Coast", section: "header", readonly: true },
    
    // Basic Info Section
    { id: "reservationCode", type: "text", label: "كود الحجز", source: "reservations.reservationCode", section: "basic", required: true },
    { id: "reservationDate", type: "date", label: "تاريخ الحجز", source: "reservations.reservationDate", section: "basic", required: true },
    { id: "clientCode", type: "text", label: "كود العميل", source: "manual", section: "basic" },
    
    // Client Information Section
    { id: "clientName", type: "text", label: "اسم العميل", source: "reservations.clientName", section: "client", required: true },
    { id: "nationality", type: "text", label: "الجنسية", source: "reservations.nationality", section: "client" },
    { id: "idPassport", type: "text", label: "بطاقة رقم قومي - جواز سفر رقم", source: "reservations.idPassport", section: "client" },
    { id: "dateOfId", type: "date", label: "لسنة", source: "reservations.dateOfId", section: "client" },
    { id: "serialNumOfId", type: "text", label: "مسلسل رقم", source: "reservations.serialNumOfId", section: "client" },
    { id: "address", type: "textarea", label: "عنوان المراسلات", source: "reservations.address", section: "client" },
    { id: "email", type: "email", label: "البريد الالكتروني", source: "reservations.email", section: "client" },
    { id: "homeNumber", type: "tel", label: "تليفون منزل", source: "reservations.homeNumber", section: "client" },
    { id: "mobileNumber", type: "tel", label: "موبايل", source: "reservations.mobileNumber", section: "client", required: true },
    
    // Unit Information Section
    { id: "unitCode", type: "text", label: "كود الوحدة", source: "units.unitCode", section: "unit", required: true },
    { id: "blockNo", type: "text", label: "عمارة", source: "units.blockNo", section: "unit" },
    { id: "floor", type: "text", label: "دور", source: "units.floor", section: "unit" },
    { id: "bua", type: "number", label: "المساحة", source: "units.bua", section: "unit" },
    { id: "outdoor", type: "number", label: "المساحة الخارجية", source: "units.outdoor", section: "unit" },
    { id: "unitPrice", type: "number", label: "سعر الوحدة", source: "units.unitPrice", section: "unit" },
    
    // Payment Section
    { id: "priceInstallment", type: "number", label: "نظام التقسيط المبدئي", source: "units.priceInstallment", section: "payment" },
    { id: "deposit", type: "number", label: "مبلغ تحت حساب الحجز للوحدة", source: "reservations.deposit", section: "payment", required: true },
    { id: "currency", type: "select", label: "العملة", source: "reservations.currency", section: "payment", options: ["جنيه مصرى", "جنية استرلينى", "دولار امريكى", "دولار كندى"] },
    { id: "paymentMethod", type: "select", label: "طريقة سداد مبلغ تحت حساب حجز", source: "reservations.paymentMethod", section: "payment", options: ["نقدى بالخزينة", "شيك", "تحويل بنكي"] },
    { id: "depositTransferNumber", type: "text", label: "رقم الشيك/ الايداع / التحويل", source: "reservations.depositTransferNumber", section: "payment" },
    { id: "dateOfDepositTransfer", type: "date", label: "بتاريخ", source: "reservations.dateOfDepositTransfer", section: "payment" },
    { id: "bankName", type: "text", label: "بنك", source: "reservations.bankName", section: "payment" },
    { id: "paymentType", type: "text", label: "طريقة الدفع", source: "reservations.payment", section: "payment" },
    
    // Staff Signatures Section
    { id: "sales", type: "text", label: "مسئول المبيعات", source: "reservations.sales", section: "signatures" },
    { id: "operationsManager", type: "text", label: "مسئول العمليات", source: "manual", section: "signatures" },
    
    // Terms and Conditions Section
    { id: "terms", type: "textarea", label: "الشروط والأحكام", source: "manual", section: "terms", value: "1. يتم التوقيع على العقد وسداد باقى مقدم الحجز خلال ثلاثة أيام عمل بحد أقصى من تاريخ هذه الاستمارة ، وفى حالة عدم السداد او التوقيع خلال هذه المدة تعتبر إستمارة الحجز لاغيه ويحق للشركة إعادة طرح الوحدة للبيع ، ولا يحق له الرجوع على الشركة حاليا او مستقبلا بشأن اعادة بيع الوحدة.\n\n2. فى حاله إمتناعى عن توقيع العقد الإبتدائى فى الموعد المحدد يعتبر ذلك عدولا نهائيا من جانبى عن الحجز و تكون هذه الإستمارة كأن لم تكن دون الحاجة إلى التنبيه أو إنذار أو حكم قضائى و يحق للشركه بيع الوحدة للغير دون الإعتداد بهذا الحجز.\n\n3. يعتبر الحجز لاغيا وكأن لم يكن دون الحاجة إلى تنبية أو إنذار أو حكم قضائى فى حاله إرتداد شيك دفعة الحجز.\n\n4. تعتبر هذة الإستمارة جزء مكمل للعقد و يعتبر توقيعى على هذه الإستمارة موافقه على كافة شروطها.\n\n5.أقر بأن عنوان المراسلة الثابت بهذه الإستمارة هو موطنى المختار الذى يصح عليه إخطارى بكافة المراسلات.\n\n6.يعتبر هذا الطلب غير منتج لأثاره القانونية ما لم يكن مختوم بخاتم الشركة و موقعا عليه من الموظف المسئول و المفوض من قبل الإدارة و مرفقا به الإيصال الدال على سداد مقدم الحجز الصادر من الشركة.\n\n7.فى حالة عدم تحصيل مبلغ جدية الحجز المذكور أعلاه تكون هذه الإستمارة كأن لم تكن دون الحاجة إلى التنبيه أو إنذار أو حكم قضائى و يحق للشركه بيع الوحدة للغير دون الإعتداد بهذا الحجز.\n\n8. يتم سداد المبلغ المتبقى للوحدة على أقساط بالاضافة الى مبلغ وديعة الصيانة طبقا لجدول الاقساط النهائى والمتفق علية والمرفق بهذه الاستمارة." },
    { id: "salesManager", type: "text", label: "مدير المبيعات", source: "reservations.salesManager", section: "signatures" },
    { id: "financialReview", type: "text", label: "المراجعة المالية", source: "manual", section: "signatures" },
    { id: "seniorSalesManager", type: "text", label: "مدير أول المبيعات", source: "reservations.seniorSalesManager", section: "signatures" },
    { id: "operationsDirector", type: "text", label: "مدير العمليات", source: "manual", section: "signatures" },
    { id: "salesSectorHead", type: "text", label: "رئيس قطاع المبيعات", source: "manual", section: "signatures" },
    { id: "operationsSectorHead", type: "text", label: "رئيس قطاع العمليات", source: "manual", section: "signatures" },
    
    // Client Signature Section
    { id: "clientSignatureName", type: "text", label: "اسم العميل", source: "reservations.clientName", section: "clientSignature", readonly: true },
    { id: "clientSignature", type: "signature", label: "التوقيع", source: "manual", section: "clientSignature" }
  ],
  layout: {
    sections: [
      { id: "header", title: "Header", order: 1 },
      { id: "basic", title: "Basic Information", order: 2 },
      { id: "client", title: "Client Information", order: 3 },
      { id: "unit", title: "Unit Information", order: 4 },
      { id: "payment", title: "Payment Information", order: 5 },
      { id: "signatures", title: "Staff Signatures", order: 6 },
      { id: "clientSignature", title: "Client Signature", order: 7 }
    ],
    direction: "rtl",
    printFormat: "A4"
  }
};

// GET /api/form-templates - Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.formTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON strings back to objects
    const parsedTemplates = templates.map(template => ({
      ...template,
      fields: JSON.parse(template.fields),
      layout: template.layout ? JSON.parse(template.layout) : null
    }));
    
    res.json({ success: true, data: parsedTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// GET /api/form-templates/:id - Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.formTemplate.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Parse JSON strings back to objects
    const parsedTemplate = {
      ...template,
      fields: JSON.parse(template.fields),
      layout: template.layout ? JSON.parse(template.layout) : null
    };
    
    res.json({ success: true, data: parsedTemplate });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template' });
  }
});

// POST /api/form-templates - Create new template
router.post('/', async (req, res) => {
  try {
    const { name, description, templateType, fields, layout, createdBy } = req.body;
    
    const template = await prisma.formTemplate.create({
      data: {
        name,
        description,
        templateType,
        fields: JSON.stringify(fields),
        layout: layout ? JSON.stringify(layout) : null,
        createdBy
      }
    });
    
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// PUT /api/form-templates/:id - Update template
router.put('/:id', async (req, res) => {
  try {
    const { name, description, templateType, fields, layout } = req.body;
    
    const template = await prisma.formTemplate.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        templateType,
        fields: JSON.stringify(fields),
        layout: layout ? JSON.stringify(layout) : null,
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// DELETE /api/form-templates/:id - Soft delete template
router.delete('/:id', async (req, res) => {
  try {
    const template = await prisma.formTemplate.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false }
    });
    
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// POST /api/form-templates/create-default - Create default template
router.post('/create-default', async (req, res) => {
  try {
    // Check if default template already exists
    const existingTemplate = await prisma.formTemplate.findFirst({
      where: { name: DEFAULT_TEMPLATE.name }
    });
    
    if (existingTemplate) {
      // Update existing template with latest fields
      const updatedTemplate = await prisma.formTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          fields: JSON.stringify(DEFAULT_TEMPLATE.fields),
          layout: JSON.stringify(DEFAULT_TEMPLATE.layout),
          updatedAt: new Date()
        }
      });
      return res.json({ success: true, data: updatedTemplate, message: 'Default template updated with latest fields' });
    }
    
    const template = await prisma.formTemplate.create({
      data: {
        ...DEFAULT_TEMPLATE,
        fields: JSON.stringify(DEFAULT_TEMPLATE.fields),
        layout: JSON.stringify(DEFAULT_TEMPLATE.layout),
        createdBy: 'System'
      }
    });
    
    res.status(201).json({ success: true, data: template, message: 'Default template created successfully' });
  } catch (error) {
    console.error('Error creating default template:', error);
    res.status(500).json({ success: false, error: 'Failed to create default template' });
  }
});

// POST /api/form-templates/update-default - Update default template with latest fields
router.post('/update-default', async (req, res) => {
  try {
    // Find existing default template
    const existingTemplate = await prisma.formTemplate.findFirst({
      where: { name: DEFAULT_TEMPLATE.name }
    });
    
    if (!existingTemplate) {
      return res.status(404).json({ success: false, error: 'Default template not found' });
    }
    
    // Update the template with new fields
    const updatedTemplate = await prisma.formTemplate.update({
      where: { id: existingTemplate.id },
      data: {
        fields: JSON.stringify(DEFAULT_TEMPLATE.fields),
        layout: JSON.stringify(DEFAULT_TEMPLATE.layout),
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, data: updatedTemplate, message: 'Default template updated successfully' });
  } catch (error) {
    console.error('Error updating default template:', error);
    res.status(500).json({ success: false, error: 'Failed to update default template' });
  }
});

module.exports = router;