const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/form-generation/merge-data/:reservationCode/:unitCode - Merge reservation and unit data
router.get('/merge-data/:reservationCode/:unitCode', async (req, res) => {
  try {
    const { reservationCode, unitCode } = req.params;
    
    // Fetch reservation data
    const reservation = await prisma.reservation.findUnique({
      where: { reservationCode }
    });
    
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }
    
    // Fetch unit data by unitCode
    const unit = await prisma.unit.findUnique({
      where: { unitCode }
    });
    
    if (!unit) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }
    
    // Verify reservation and unit are linked
    if (reservation.unitCode !== unit.unitCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Reservation and unit are not linked. Expected unitCode: ' + reservation.unitCode 
      });
    }
    
    // Merge the data
    const mergedData = {
      reservation,
      unit,
      linkedBy: 'unitCode',
      mergedAt: new Date()
    };
    
    res.json({ success: true, data: mergedData });
  } catch (error) {
    console.error('Error merging data:', error);
    res.status(500).json({ success: false, error: 'Failed to merge data' });
  }
});

// GET /api/form-generation/search-reservations - Search reservations for form generation
router.get('/search-reservations', async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    
    const whereClause = search ? {
      OR: [
        { reservationCode: { contains: search } },
        { clientName: { contains: search } },
        { unitCode: { contains: search } }
      ]
    } : {};
    
    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      take: parseInt(limit),
      orderBy: { reservationDate: 'desc' },
      select: {
        id: true,
        reservationCode: true,
        clientName: true,
        unitCode: true,
        reservationDate: true,
        mobileNumber: true
      }
    });
    
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Error searching reservations:', error);
    res.status(500).json({ success: false, error: 'Failed to search reservations' });
  }
});

// POST /api/form-generation/populate-template - Populate template with data
router.post('/populate-template', async (req, res) => {
  try {
    const { templateId, reservationCode, unitCode } = req.body;
    
    if (!templateId || !reservationCode || !unitCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'templateId, reservationCode, and unitCode are required' 
      });
    }
    
    // Get template
    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Parse JSON fields
    template.fields = JSON.parse(template.fields);
    template.layout = template.layout ? JSON.parse(template.layout) : null;
    
    // Get merged data
    const reservation = await prisma.reservation.findUnique({
      where: { reservationCode }
    });
    
    const unit = await prisma.unit.findUnique({
      where: { unitCode }
    });
    
    if (!reservation || !unit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Reservation or unit not found' 
      });
    }
    
    // Populate template fields with data
    const populatedFields = template.fields.map(field => {
      let value = field.value || '';
      
      // Map data based on source
      if (field.source && field.source !== 'manual') {
        const [table, column] = field.source.split('.');
        
        if (table === 'reservations' && reservation[column] !== undefined) {
          value = reservation[column];
        } else if (table === 'units' && unit[column] !== undefined) {
          value = unit[column];
        }
        
        // Format dates
        if (field.type === 'date' && value) {
          value = new Date(value).toISOString().split('T')[0];
        }
        
        // Format numbers
        if (field.type === 'number' && value !== null) {
          value = parseFloat(value) || 0;
        }
      }
      
      return {
        ...field,
        value: value
      };
    });
    
    const populatedTemplate = {
      ...template,
      fields: populatedFields,
      populatedWith: {
        reservationCode,
        unitCode,
        clientName: reservation.clientName,
        populatedAt: new Date()
      }
    };
    
    res.json({ success: true, data: populatedTemplate });
  } catch (error) {
    console.error('Error populating template:', error);
    res.status(500).json({ success: false, error: 'Failed to populate template' });
  }
});

// POST /api/form-generation/generate - Generate a new form
router.post('/generate', async (req, res) => {
  try {
    const { templateId, reservationCode, unitCode, generatedBy } = req.body;
    
    if (!templateId || !reservationCode || !unitCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'templateId, reservationCode, and unitCode are required' 
      });
    }
    
    // Get template
    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Parse JSON fields
    template.fields = JSON.parse(template.fields);
    template.layout = template.layout ? JSON.parse(template.layout) : null;
    
    // Get merged data
    const reservation = await prisma.reservation.findUnique({
      where: { reservationCode }
    });
    
    const unit = await prisma.unit.findUnique({
      where: { unitCode }
    });
    
    if (!reservation || !unit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Reservation or unit not found' 
      });
    }
    
    // Populate template fields with data
    const populatedFields = template.fields.map(field => {
      let value = field.value || '';
      
      // Map data based on source
      if (field.source && field.source !== 'manual') {
        const [table, column] = field.source.split('.');
        
        if (table === 'reservations' && reservation[column] !== undefined) {
          value = reservation[column];
        } else if (table === 'units' && unit[column] !== undefined) {
          value = unit[column];
        }
        
        // Format dates
        if (field.type === 'date' && value) {
          value = new Date(value).toISOString().split('T')[0];
        }
        
        // Format numbers
        if (field.type === 'number' && value !== null) {
          value = parseFloat(value) || 0;
        }
      }
      
      return {
        ...field,
        value: value
      };
    });
    
    const populatedTemplate = {
      ...template,
      fields: populatedFields,
      populatedWith: {
        reservationCode,
        unitCode,
        clientName: reservation.clientName,
        populatedAt: new Date()
      }
    };
    
    // Create generated form record
    const generatedForm = await prisma.generatedForm.create({
      data: {
        templateId,
        reservationCode,
        unitCode,
        formData: JSON.stringify(populatedTemplate),
        status: 'draft',
        generatedBy: generatedBy || 'Unknown'
      }
    });
    
    res.status(201).json({ success: true, data: generatedForm });
  } catch (error) {
    console.error('Error generating form:', error);
    res.status(500).json({ success: false, error: 'Failed to generate form' });
  }
});

// GET /api/form-generation/forms - Get all generated forms
router.get('/forms', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const whereClause = status ? { status } : {};
    
    const forms = await prisma.generatedForm.findMany({
      where: whereClause,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { name: true, templateType: true }
        }
      }
    });
    
    res.json({ success: true, data: forms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// GET /api/form-generation/forms/:id - Get single generated form
router.get('/forms/:id', async (req, res) => {
  try {
    const form = await prisma.generatedForm.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        template: true
      }
    });
    
    if (!form) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    
    res.json({ success: true, data: form });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch form' });
  }
});

// PUT /api/form-generation/forms/:id - Update generated form
router.put('/forms/:id', async (req, res) => {
  try {
    const { formData, status } = req.body;
    
    const updatedForm = await prisma.generatedForm.update({
      where: { id: parseInt(req.params.id) },
      data: {
        formData,
        status: status || 'draft',
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, data: updatedForm });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ success: false, error: 'Failed to update form' });
  }
});

// POST /api/form-generation/forms/:id/mark-printed - Mark form as printed
router.post('/forms/:id/mark-printed', async (req, res) => {
  try {
    const updatedForm = await prisma.generatedForm.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'printed',
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, data: updatedForm });
  } catch (error) {
    console.error('Error marking form as printed:', error);
    res.status(500).json({ success: false, error: 'Failed to mark form as printed' });
  }
});

module.exports = router;