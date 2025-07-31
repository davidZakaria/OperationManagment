@echo off
echo === Setting up Operations Data Manager ===

echo Step 1: Cleaning up database...
cd backend
rmdir /s /q prisma\migrations 2>nul
echo Database migrations removed.

echo Step 2: Creating new SQLite database...
npx prisma migrate dev --name init
echo Database created successfully!

echo Step 3: Starting backend server...
start "Backend Server" cmd /k "node server.js"

echo Step 4: Starting frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo === Both servers are starting ===
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause