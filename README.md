# Operations Data Manager

A comprehensive data management application for operations departments to handle client data and company units data. Built with React, Node.js, Express, PostgreSQL, and featuring Excel import/export capabilities.

## 🚀 Features

- **Excel Import/Export**: Import data from Excel files and export filtered data back to Excel
- **Advanced Data Grid**: View, edit, and manage data with powerful filtering, sorting, and search capabilities
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **Filtering System**: Advanced filtering by project, type, sales status, and more
- **Search Functionality**: Search by client name, unit code, unit number, and other fields
- **Data Validation**: Comprehensive validation during import with error reporting
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Built with Ant Design for a professional look and feel

## 📊 Data Structure

The application handles the following data columns:
- DATE, UNIT CODE, Project, Type, Sales Status
- Client information: name, Address, Phone Number
- Unit details: Block no, Plot, Floor, unit no, BUA, Garden, Roof, Outdoor
- Financial data: unit price, Contract price, price installment, Maintenance
- Sales information: Sales Agent, broker NAM, SOURCE
- Additional: Parking, Year, delivery Date, Grace Period, Contract Finishing, COMMENTS

## 🛠️ Technology Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **PostgreSQL** - Database
- **Prisma** - Database ORM
- **xlsx** - Excel file processing
- **multer** - File upload handling

### Frontend
- **React 18** with **TypeScript** - UI framework
- **Ant Design** - UI component library
- **AG-Grid** - Advanced data grid
- **Axios** - HTTP client
- **React Router** - Navigation

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone and Setup Project

```bash
# Navigate to your project directory
cd "operation operator pro max"

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL if not already installed
# On Windows: Download from https://www.postgresql.org/download/windows/
# On macOS: brew install postgresql
# On Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Create database
createdb operations_db

# Or using psql:
psql -U postgres
CREATE DATABASE operations_db;
\q
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name operations-postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=operations_db -p 5432:5432 -d postgres:13
```

### 3. Environment Configuration

Create `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/operations_db"

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

Replace `username` and `password` with your PostgreSQL credentials.

### 4. Database Migration

```bash
# From the backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: View database in Prisma Studio
npx prisma studio
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# From the root directory, run both frontend and backend:
npm run dev

# Or run separately:
# Backend (from backend directory):
npm run dev

# Frontend (from frontend directory):
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio: http://localhost:5555 (if running)

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
```

## 📖 Usage Guide

### 1. Uploading Data

1. Navigate to the **Upload Data** page
2. Drag and drop an Excel file or click to select
3. Ensure your Excel file has the correct column headers
4. Click "Upload & Process" to import the data
5. Review the import results and any errors

### 2. Managing Data

1. Go to **Units Data** page to view all records
2. Use filters to narrow down results:
   - Search by client name, unit code, etc.
   - Filter by project, type, or sales status
3. Edit data directly in the grid or use the edit button
4. Select multiple rows for bulk operations

### 3. Exporting Data

1. Visit the **Export Data** page
2. Apply any desired filters
3. Click "Export to Excel" to download the filtered data
4. The exported file will include all columns with proper formatting

### 4. Dashboard Overview

- View key statistics and metrics
- Monitor sales performance
- See recently added units
- Quick access to main features

## 📁 Project Structure

```
operation operator pro max/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── routes/
│   │   ├── units.js           # Units CRUD operations
│   │   └── upload.js          # File upload handling
│   ├── utils/
│   │   └── database.js        # Database connection
│   ├── package.json
│   └── server.js              # Express server
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── UnitsTable.tsx
│   │   │   ├── UploadData.tsx
│   │   │   └── ExportData.tsx
│   │   ├── services/
│   │   │   └── api.ts          # API service layer
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript types
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.tsx
│   └── package.json
├── package.json               # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Units Management
- `GET /api/units` - Get all units with filtering and pagination
- `GET /api/units/:id` - Get single unit
- `POST /api/units` - Create new unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit
- `GET /api/units/filters` - Get filter options
- `GET /api/units/export/excel` - Export units to Excel
- `GET /api/units/stats/dashboard` - Get dashboard statistics

### File Operations
- `POST /api/upload` - Upload and process Excel file
- `GET /api/upload/history` - Get upload history

### System
- `GET /api/health` - Health check

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Issues:**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists and credentials are correct

**File Upload Issues:**
- Check file size (max 10MB)
- Ensure file format is .xlsx or .xls
- Verify column headers match expected format

**Build Issues:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Ensure all dependencies are installed

### Performance Optimization

For large datasets:
- Use pagination in the data grid
- Apply filters to reduce data load
- Consider database indexing for frequently queried columns

## 🔒 Security Considerations

- File uploads are validated for type and size
- SQL injection protection via Prisma ORM
- Input validation on both client and server
- CORS configuration for API protection

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📈 Future Enhancements

- User authentication and role-based access
- Real-time notifications
- Advanced reporting and charts
- Data backup and restore features
- Integration with external APIs
- Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository

---

**Built with ❤️ for Operations Departments** 