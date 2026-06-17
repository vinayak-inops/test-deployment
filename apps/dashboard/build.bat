@echo off
REM Dashboard App Build Script for Windows
REM This script builds the dashboard application with proper configuration

setlocal enabledelayedexpansion

echo 🚀 Starting Dashboard App Build Process...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)

echo [SUCCESS] Node.js version check passed
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm.
    exit /b 1
)

echo [SUCCESS] npm version:
npm --version

REM Clean previous builds
echo [INFO] Cleaning previous builds...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out
if exist dist rmdir /s /q dist
echo [SUCCESS] Clean completed

REM Install dependencies
echo [INFO] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed

REM Run type checking
echo [INFO] Running TypeScript type checking...
call npm run type-check
if errorlevel 1 (
    echo [ERROR] Type checking failed
    exit /b 1
)
echo [SUCCESS] Type checking passed

REM Run linting
echo [INFO] Running ESLint...
call npm run lint
if errorlevel 1 (
    echo [WARNING] Linting issues found, but continuing with build
)
echo [SUCCESS] Linting completed

REM Build the application
echo [INFO] Building the application...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)
echo [SUCCESS] Build completed successfully

REM Check if build artifacts exist
if not exist .next (
    echo [ERROR] Build failed: .next directory not found
    exit /b 1
)

echo [SUCCESS] Build artifacts created successfully

REM Display build information
echo [INFO] Build Information:
echo   - Build directory: .next
echo   - Port: 3004
echo   - Base path: /dashboard
echo   - Environment: production

echo.
echo 🎉 Dashboard App Build Process Completed Successfully!
echo.
echo [INFO] To start the application:
echo   npm run start
echo.
echo [INFO] To build Docker image:
echo   npm run build:docker
echo.
echo [INFO] To run in development mode:
echo   npm run dev

pause

