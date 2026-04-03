@echo off
echo ========================================
echo Employee Management System
echo ========================================
echo.
echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "node backend/index (1).js"
timeout /t 2 /nobreak >nul
echo.
echo Starting Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd frontend_new && npm run dev"
echo.
echo ========================================
echo Both servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press any key to exit this window...
pause >nul
