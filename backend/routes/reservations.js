const express = require('express');
const xlsx = require('xlsx');
const prisma = require('../utils/database');

const router = express.Router();

// Get all reservations with filtering, searching, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      nationality = '',
      currency = '',
      paymentMethod = '',
      sales = '',
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
        { reservationCode: { contains: search } },
        { unitCode: { contains: search } },
        { email: { contains: search } },
        { mobileNumber: { contains: search } },
        { sales: { contains: search } },
        { salesManager: { contains: search } }
      ];
    }
    
    // Filtering
    if (nationality) {
      where.nationality = { contains: nationality };
    }
    if (currency) {
      where.currency = { contains: currency };
    }
    if (paymentMethod) {
      where.paymentMethod = { contains: paymentMethod };
    }
    if (sales) {
      where.sales = { contains: sales };
    }

    // Get total count for pagination
    const totalCount = await prisma.reservation.count({ where });
    
    // Get reservations with pagination and sorting
    const reservations = await prisma.reservation.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    res.json({
      data: reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Get unique values for filter dropdowns
router.get('/filters', async (req, res) => {
  try {
    const [nationalities, currencies, paymentMethods, salesPeople, salesManagers] = await Promise.all([
      prisma.reservation.findMany({
        select: { nationality: true },
        where: { nationality: { not: null } },
        distinct: ['nationality']
      }),
      prisma.reservation.findMany({
        select: { currency: true },
        where: { currency: { not: null } },
        distinct: ['currency']
      }),
      prisma.reservation.findMany({
        select: { paymentMethod: true },
        where: { paymentMethod: { not: null } },
        distinct: ['paymentMethod']
      }),
      prisma.reservation.findMany({
        select: { sales: true },
        where: { sales: { not: null } },
        distinct: ['sales']
      }),
      prisma.reservation.findMany({
        select: { salesManager: true },
        where: { salesManager: { not: null } },
        distinct: ['salesManager']
      })
    ]);

    res.json({
      nationalities: nationalities.map(n => n.nationality).filter(Boolean),
      currencies: currencies.map(c => c.currency).filter(Boolean),
      paymentMethods: paymentMethods.map(p => p.paymentMethod).filter(Boolean),
      salesPeople: salesPeople.map(s => s.sales).filter(Boolean),
      salesManagers: salesManagers.map(s => s.salesManager).filter(Boolean)
    });

  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Get single reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);

  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Create new reservation
router.post('/', async (req, res) => {
  try {
    const reservationData = req.body;
    
    // Check if reservation code already exists
    if (reservationData.reservationCode) {
      const existingReservation = await prisma.reservation.findUnique({
        where: { reservationCode: reservationData.reservationCode }
      });
      
      if (existingReservation) {
        return res.status(400).json({ error: 'Reservation code already exists' });
      }
    }

    const reservation = await prisma.reservation.create({
      data: reservationData
    });

    res.status(201).json(reservation);

  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// Update reservation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reservationData = req.body;

    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if reservation code is being changed and if it conflicts
    if (reservationData.reservationCode && reservationData.reservationCode !== existingReservation.reservationCode) {
      const conflictingReservation = await prisma.reservation.findUnique({
        where: { reservationCode: reservationData.reservationCode }
      });
      
      if (conflictingReservation) {
        return res.status(400).json({ error: 'Reservation code already exists' });
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: reservationData
    });

    res.json(updatedReservation);

  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// Delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingReservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    await prisma.reservation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Reservation deleted successfully' });

  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

// Export reservations to Excel
router.get('/export/excel', async (req, res) => {
  try {
    const {
      search = '',
      nationality = '',
      currency = '',
      paymentMethod = '',
      sales = ''
    } = req.query;

    // Build where clause (same as GET route)
    const where = {};
    
    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { reservationCode: { contains: search } },
        { unitCode: { contains: search } },
        { email: { contains: search } },
        { mobileNumber: { contains: search } },
        { sales: { contains: search } },
        { salesManager: { contains: search } }
      ];
    }
    
    if (nationality) where.nationality = { contains: nationality };
    if (currency) where.currency = { contains: currency };
    if (paymentMethod) where.paymentMethod = { contains: paymentMethod };
    if (sales) where.sales = { contains: sales };

    // Get all matching reservations
    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for Excel export
    const excelData = reservations.map(reservation => ({
      'Reservation code': reservation.reservationCode || '',
      'SR': reservation.sr || '',
      'Reservation Date': reservation.reservationDate ? reservation.reservationDate.toISOString().split('T')[0] : '',
      'Client Name': reservation.clientName || '',
      'Nationality': reservation.nationality || '',
      'ID/Passport': reservation.idPassport || '',
      'Date of ID': reservation.dateOfId ? reservation.dateOfId.toISOString().split('T')[0] : '',
      'Serial Num. of ID': reservation.serialNumOfId || '',
      'Address': reservation.address || '',
      'Email': reservation.email || '',
      'Home Number': reservation.homeNumber || '',
      'Mobile Number': reservation.mobileNumber || '',
      'Unit Code': reservation.unitCode || '',
      'Payment': reservation.payment || '',
      'Deposit': reservation.deposit || '',
      'Currency': reservation.currency || '',
      'Payment Method': reservation.paymentMethod || '',
      'Number of Deposit/Transfer': reservation.depositTransferNumber || '',
      'Date of Deposit/Transfer': reservation.dateOfDepositTransfer ? reservation.dateOfDepositTransfer.toISOString().split('T')[0] : '',
      'Bank Name': reservation.bankName || '',
      'Sales': reservation.sales || '',
      'Sales Manager': reservation.salesManager || '',
      'Senior Sales Manager': reservation.seniorSalesManager || '',
      'Cancel': reservation.cancel || ''
    }));

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reservations Data');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=reservations-export-${new Date().toISOString().split('T')[0]}.xlsx`);
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
      totalReservations,
      cancelledReservations,
      activeReservations,
      totalDeposits,
      totalPayments,
      recentReservations
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({
        where: { cancel: { not: null, not: '' } }
      }),
      prisma.reservation.count({
        where: { 
          OR: [
            { cancel: null },
            { cancel: '' }
          ]
        }
      }),
      prisma.reservation.aggregate({
        _sum: { deposit: true }
      }),
      prisma.reservation.aggregate({
        _sum: { payment: true }
      }),
      prisma.reservation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reservationCode: true,
          clientName: true,
          unitCode: true,
          cancel: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      totalReservations,
      cancelledReservations,
      activeReservations,
      totalDeposits: totalDeposits._sum.deposit || 0,
      totalPayments: totalPayments._sum.payment || 0,
      recentReservations
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router; 