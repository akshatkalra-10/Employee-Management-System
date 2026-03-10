@echo off
echo Employee Management System - Starting both servers...
echo.
echo Starting React Development Server (port 3000)...
echo Starting Express Backend Server (port 3001)...
echo.
echo Please wait for both servers to start...
echo.

cd "%~dp0"

start cmd /k npm run dev
timeout /t 3
start cmd /k node "index (1).js"

echo Both servers should be running now.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo.
echo Login credentials:
echo Username: admin
echo Password: admin123
echo.
pause
