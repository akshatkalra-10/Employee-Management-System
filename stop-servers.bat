@echo off
echo ========================================
echo Stopping Employee Management System
echo ========================================
echo.
echo Stopping processes on port 3000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
echo.
echo Stopping processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul
echo.
echo ========================================
echo Servers stopped successfully!
echo ========================================
echo.
pause
