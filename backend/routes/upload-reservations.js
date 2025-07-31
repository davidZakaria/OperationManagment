const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/database');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheetml') || file.mimetype.includes('excel') || 
        path.extname(file.originalname).toLowerCase() === '.xlsx' ||
        path.extname(file.originalname).toLowerCase() === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to parse Excel date
function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  
  if (typeof excelDate === 'number') {
    // Excel serial date
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date;
  } else if (typeof excelDate === 'string') {
    // Try to parse string date
    const parsed = new Date(excelDate);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

// Helper function to clean and convert reservation data
function cleanReservationRowData(row) {
  // Create a normalized version of the row with trimmed keys
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    const trimmedKey = key.trim();
    normalizedRow[trimmedKey] = row[key];
  });
  
  // Handle case variations for Reservation code - try multiple possible column names
  let reservationCodeValue = null;
  const possibleHeaders = [
    'Reservation code', 'Reservation Code', 'RESERVATION CODE', 'reservation code',
    'ReservationCode', 'reservationCode', 'Reservation_code', 'Reservation_Code',
    'Reservation-code', 'Reservation-Code'
  ];
  
  for (const header of possibleHeaders) {
    if (normalizedRow[header]) {
      reservationCodeValue = normalizedRow[header];
      break;
    }
  }
  
  return {
    reservationCode: reservationCodeValue ? String(reservationCodeValue).trim() : null,
    sr: normalizedRow['SR'] ? String(normalizedRow['SR']).trim() : null,
    reservationDate: parseExcelDate(normalizedRow['Reservation Date']),
    clientName: normalizedRow['Client Name'] ? String(normalizedRow['Client Name']).trim() : null,
    nationality: normalizedRow['Nationality'] ? String(normalizedRow['Nationality']).trim() : null,
    idPassport: normalizedRow['ID/Passport'] ? String(normalizedRow['ID/Passport']).trim() : null,
    dateOfId: parseExcelDate(normalizedRow['Date of ID']),
    serialNumOfId: normalizedRow['Serial Num. of ID'] ? String(normalizedRow['Serial Num. of ID']).trim() : null,
    address: normalizedRow['Address'] ? String(normalizedRow['Address']).trim() : null,
    email: normalizedRow['Email'] ? String(normalizedRow['Email']).trim() : null,
    homeNumber: normalizedRow['Home Number'] ? String(normalizedRow['Home Number']).trim() : null,
    mobileNumber: normalizedRow['Mobile Number'] ? String(normalizedRow['Mobile Number']).trim() : null,
    unitCode: normalizedRow['Unit Code'] || normalizedRow['Unit code'] ? String(normalizedRow['Unit Code'] || normalizedRow['Unit code']).trim() : null,
    payment: normalizedRow['Payment'] ? parseFloat(normalizedRow['Payment']) : null,
    deposit: normalizedRow['Deposit'] ? parseFloat(normalizedRow['Deposit']) : null,
    currency: normalizedRow['Currency'] ? String(normalizedRow['Currency']).trim() : null,
    paymentMethod: normalizedRow['Payment Method'] ? String(normalizedRow['Payment Method']).trim() : null,
    depositTransferNumber: normalizedRow['Number of Deposit/Transfer'] ? String(normalizedRow['Number of Deposit/Transfer']).trim() : null,
    dateOfDepositTransfer: parseExcelDate(normalizedRow['Date of Deposit/Transfer']),
    bankName: normalizedRow['Bank Name'] ? String(normalizedRow['Bank Name']).trim() : null,
    sales: normalizedRow['Sales'] ? String(normalizedRow['Sales']).trim() : null,
    salesManager: normalizedRow['Sales Manager'] || normalizedRow['Sales Manger'] ? String(normalizedRow['Sales Manager'] || normalizedRow['Sales Manger']).trim() : null,
    seniorSalesManager: normalizedRow['Senior Sales Manager'] || normalizedRow['Senior Sales Manger'] ? String(normalizedRow['Senior Sales Manager'] || normalizedRow['Senior Sales Manger']).trim() : null,
    cancel: normalizedRow['Cancel'] ? String(normalizedRow['Cancel']).trim() : null,
  };
}

// Upload and parse Excel file for reservations
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    // Debug: Log available columns
    console.log('=== RESERVATION UPLOAD DEBUG ===');
    console.log('Total rows in Excel:', jsonData.length);
    console.log('Available columns in Excel:', Object.keys(jsonData[0] || {}));
    console.log('First row sample:', JSON.stringify(jsonData[0], null, 2));

    // Process and clean data
    const cleanedData = jsonData.map(cleanReservationRowData);
    
    // Debug: Log cleaned data sample
    console.log('First cleaned row:', JSON.stringify(cleanedData[0], null, 2));
    
    // Filter out rows without reservation code (required field)
    const validData = cleanedData.filter(row => row.reservationCode);
    
    console.log('Valid rows with reservation code:', validData.length);
    console.log('=== END DEBUG ===');

    if (validData.length === 0) {
      console.log('ERROR: No valid data found - no reservation codes detected');
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: 'No valid data found. Reservation Code is required.',
        availableColumns: Object.keys(jsonData[0] || {}),
        sampleRow: jsonData[0]
      });
    }

    // Save to database
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const rowData of validData) {
      try {
        await prisma.reservation.upsert({
          where: { reservationCode: rowData.reservationCode },
          update: rowData,
          create: rowData
        });
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          reservationCode: rowData.reservationCode,
          error: error.message
        });
      }
    }

    // Record import history
    await prisma.importHistory.create({
      data: {
        filename: req.file.originalname,
        recordCount: successCount
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'File processed successfully',
      totalRows: jsonData.length,
      validRows: validData.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Return first 10 errors only
    });

  } catch (error) {
    console.error('Upload reservations error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process file',
      message: error.message 
    });
  }
});

// Get upload history for reservations
router.get('/history', async (req, res) => {
  try {
    const history = await prisma.importHistory.findMany({
      orderBy: { importedAt: 'desc' },
      take: 20
    });
    
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

module.exports = router; 