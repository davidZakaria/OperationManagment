const express = require('express');
const xlsx = require('xlsx');
const prisma = require('../utils/database');

const router = express.Router();

// Get all units with filtering, searching, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      project = '',
      type = '',
      salesStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for filtering and searching
    const where = {};
    
    // Search functionality
    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { unitCode: { contains: search } },
        { unitNo: { contains: search } },
        { salesAgent: { contains: search } },
        { brokerName: { contains: search } }
      ];
    }
    
    // Filtering
    if (project) {
      where.project = { contains: project };
    }
    if (type) {
      where.type = { contains: type };
    }
    if (salesStatus) {
      where.salesStatus = { contains: salesStatus };
    }

    // Get total count for pagination
    const totalCount = await prisma.unit.count({ where });
    
    // Get units with pagination and sorting
    const units = await prisma.unit.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    res.json({
      data: units,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Get unique values for filter dropdowns
router.get('/filters', async (req, res) => {
  try {
    const [projects, types, salesStatuses, salesAgents] = await Promise.all([
      prisma.unit.findMany({
        select: { project: true },
        where: { project: { not: null } },
        distinct: ['project']
      }),
      prisma.unit.findMany({
        select: { type: true },
        where: { type: { not: null } },
        distinct: ['type']
      }),
      prisma.unit.findMany({
        select: { salesStatus: true },
        where: { salesStatus: { not: null } },
        distinct: ['salesStatus']
      }),
      prisma.unit.findMany({
        select: { salesAgent: true },
        where: { salesAgent: { not: null } },
        distinct: ['salesAgent']
      })
    ]);

    res.json({
      projects: projects.map(p => p.project).filter(Boolean),
      types: types.map(t => t.type).filter(Boolean),
      salesStatuses: salesStatuses.map(s => s.salesStatus).filter(Boolean),
      salesAgents: salesAgents.map(s => s.salesAgent).filter(Boolean)
    });

  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Get single unit by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json(unit);

  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ error: 'Failed to fetch unit' });
  }
});

// Create new unit
router.post('/', async (req, res) => {
  try {
    const unitData = req.body;
    
    // Check if unit code already exists
    if (unitData.unitCode) {
      const existingUnit = await prisma.unit.findUnique({
        where: { unitCode: unitData.unitCode }
      });
      
      if (existingUnit) {
        return res.status(400).json({ error: 'Unit code already exists' });
      }
    }

    // Convert and validate data types
    const processedData = {
      ...unitData,
      // Convert numeric fields from strings to numbers
      bua: unitData.bua ? parseFloat(unitData.bua) : null,
      garden: unitData.garden ? parseFloat(unitData.garden) : null,
      roof: unitData.roof ? parseFloat(unitData.roof) : null,
      outdoor: unitData.outdoor ? parseFloat(unitData.outdoor) : null,
      unitPrice: unitData.unitPrice ? parseFloat(unitData.unitPrice) : null,
      contractPrice: unitData.contractPrice ? parseFloat(unitData.contractPrice) : null,
      priceInstallment: unitData.priceInstallment ? parseFloat(unitData.priceInstallment) : null,
      maintenance: unitData.maintenance ? parseFloat(unitData.maintenance) : null,
      year: unitData.year ? parseInt(unitData.year) : null,
      gracePeriod: unitData.gracePeriod ? parseInt(unitData.gracePeriod) : null,
      // Convert date strings to Date objects
      date: unitData.date ? new Date(unitData.date) : null,
      deliveryDate: unitData.deliveryDate ? new Date(unitData.deliveryDate) : null,
    };

    const unit = await prisma.unit.create({
      data: processedData
    });

    res.status(201).json(unit);

  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Update unit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const unitData = req.body;

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUnit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Check if unit code is being changed and if it conflicts
    if (unitData.unitCode && unitData.unitCode !== existingUnit.unitCode) {
      const conflictingUnit = await prisma.unit.findUnique({
        where: { unitCode: unitData.unitCode }
      });
      
      if (conflictingUnit) {
        return res.status(400).json({ error: 'Unit code already exists' });
      }
    }

    // Convert and validate data types (same as create)
    const processedData = {
      ...unitData,
      // Convert numeric fields from strings to numbers
      bua: unitData.bua ? parseFloat(unitData.bua) : null,
      garden: unitData.garden ? parseFloat(unitData.garden) : null,
      roof: unitData.roof ? parseFloat(unitData.roof) : null,
      outdoor: unitData.outdoor ? parseFloat(unitData.outdoor) : null,
      unitPrice: unitData.unitPrice ? parseFloat(unitData.unitPrice) : null,
      contractPrice: unitData.contractPrice ? parseFloat(unitData.contractPrice) : null,
      priceInstallment: unitData.priceInstallment ? parseFloat(unitData.priceInstallment) : null,
      maintenance: unitData.maintenance ? parseFloat(unitData.maintenance) : null,
      year: unitData.year ? parseInt(unitData.year) : null,
      gracePeriod: unitData.gracePeriod ? parseInt(unitData.gracePeriod) : null,
      // Convert date strings to Date objects
      date: unitData.date ? new Date(unitData.date) : null,
      deliveryDate: unitData.deliveryDate ? new Date(unitData.deliveryDate) : null,
    };

    const updatedUnit = await prisma.unit.update({
      where: { id: parseInt(id) },
      data: processedData
    });

    res.json(updatedUnit);

  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// Delete unit
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingUnit = await prisma.unit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUnit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    await prisma.unit.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Unit deleted successfully' });

  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// Export units to Excel
router.get('/export/excel', async (req, res) => {
  try {
    const {
      search = '',
      project = '',
      type = '',
      salesStatus = ''
    } = req.query;

    // Build where clause (same as GET route)
    const where = {};
    
    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { unitCode: { contains: search } },
        { unitNo: { contains: search } },
        { salesAgent: { contains: search } },
        { brokerName: { contains: search } }
      ];
    }
    
    if (project) where.project = { contains: project };
    if (type) where.type = { contains: type };
    if (salesStatus) where.salesStatus = { contains: salesStatus };

    // Get all matching units
    const units = await prisma.unit.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for Excel export
    const excelData = units.map(unit => ({
      'DATE': unit.date ? unit.date.toISOString().split('T')[0] : '',
      'UNIT CODE': unit.unitCode || '',
      'Project': unit.project || '',
      'Type': unit.type || '',
      'Sales Status': unit.salesStatus || '',
      'name': unit.clientName || '',
      'Block no': unit.blockNo || '',
      'Plot': unit.plot || '',
      'Floor': unit.floor || '',
      'unit no': unit.unitNo || '',
      'BUA': unit.bua || '',
      'Garden': unit.garden || '',
      'Roof': unit.roof || '',
      'Outdoor': unit.outdoor || '',
      'unit price': unit.unitPrice || '',
      'Contract price': unit.contractPrice || '',
      'price installment': unit.priceInstallment || '',
      'Sales Agent': unit.salesAgent || '',
      'broker NAM': unit.brokerName || '',
      'SOURCE': unit.source || '',
      'Address': unit.address || '',
      'Phone Number': unit.phoneNumber || '',
      'Maintenance': unit.maintenance || '',
      'Parking': unit.parking || '',
      'Year': unit.year || '',
      'delivery Date': unit.deliveryDate ? unit.deliveryDate.toISOString().split('T')[0] : '',
      'Grace Period': unit.gracePeriod || '',
      'Contract Finishing': unit.contractFinishing || '',
      'COMMENTS': unit.comments || ''
    }));

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Units Data');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=units-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const [
      totalUnits,
      soldUnits,
      availableUnits,
      totalValue,
      recentUnits
    ] = await Promise.all([
      prisma.unit.count(),
      prisma.unit.count({
        where: { salesStatus: { contains: 'sold' } }
      }),
      prisma.unit.count({
        where: { salesStatus: { contains: 'available' } }
      }),
      prisma.unit.aggregate({
        _sum: { contractPrice: true }
      }),
      prisma.unit.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          unitCode: true,
          project: true,
          clientName: true,
          salesStatus: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      totalUnits,
      soldUnits,
      availableUnits,
      reservedUnits: totalUnits - soldUnits - availableUnits,
      totalValue: totalValue._sum.contractPrice || 0,
      recentUnits
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router; 