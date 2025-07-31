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

// Helper function to clean and convert data
function cleanRowData(row) {
  return {
    date: parseExcelDate(row['DATE']),
    unitCode: row['UNIT CODE'] ? String(row['UNIT CODE']).trim() : null,
    project: row['Project'] ? String(row['Project']).trim() : null,
    type: row['Type'] ? String(row['Type']).trim() : null,
    salesStatus: row['Sales Status'] ? String(row['Sales Status']).trim() : null,
    clientName: row['name'] ? String(row['name']).trim() : null,
    blockNo: row['Block no'] ? String(row['Block no']).trim() : null,
    plot: row['Plot'] ? String(row['Plot']).trim() : null,
    floor: row['Floor'] ? String(row['Floor']).trim() : null,
    unitNo: row['unit no'] ? String(row['unit no']).trim() : null,
    bua: row['BUA'] ? parseFloat(row['BUA']) : null,
    garden: row['Garden'] ? parseFloat(row['Garden']) : null,
    roof: row['Roof'] ? parseFloat(row['Roof']) : null,
    outdoor: row['Outdoor'] ? parseFloat(row['Outdoor']) : null,
    unitPrice: row['unit price'] ? parseFloat(row['unit price']) : null,
    contractPrice: row['Contract price'] ? parseFloat(row['Contract price']) : null,
    priceInstallment: row['price installment'] ? parseFloat(row['price installment']) : null,
    salesAgent: row['Sales Agent'] ? String(row['Sales Agent']).trim() : null,
    brokerName: row['broker NAM'] ? String(row['broker NAM']).trim() : null,
    source: row['SOURCE'] ? String(row['SOURCE']).trim() : null,
    address: row['Address'] ? String(row['Address']).trim() : null,
    phoneNumber: row['Phone Number'] ? String(row['Phone Number']).trim() : null,
    maintenance: row['Maintenance'] ? parseFloat(row['Maintenance']) : null,
    parking: row['Parking'] ? String(row['Parking']).trim() : null,
    year: row['Year'] ? parseInt(row['Year']) : null,
    deliveryDate: parseExcelDate(row['delivery Date']),
    gracePeriod: row['Grace Period'] ? parseInt(row['Grace Period']) : null,
    contractFinishing: row['Contract Finishing'] ? String(row['Contract Finishing']).trim() : null,
    comments: row['COMMENTS'] ? String(row['COMMENTS']).trim() : null,
  };
}

// Upload and parse Excel file
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

    // Process and clean data
    const cleanedData = jsonData.map(cleanRowData);
    
    // Filter out rows without unit code (required field)
    const validData = cleanedData.filter(row => row.unitCode);

    if (validData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'No valid data found. Unit Code is required.' });
    }

    // Save to database
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const rowData of validData) {
      try {
        await prisma.unit.upsert({
          where: { unitCode: rowData.unitCode },
          update: rowData,
          create: rowData
        });
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          unitCode: rowData.unitCode,
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
    console.error('Upload error:', error);
    
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

// Get upload history
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