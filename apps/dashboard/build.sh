#!/bin/bash

# Dashboard App Build Script
# This script builds the dashboard application with proper configuration

set -e  # Exit on any error

echo "🚀 Starting Dashboard App Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean 2>/dev/null || true
print_success "Clean completed"

# Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Run type checking
print_status "Running TypeScript type checking..."
npm run type-check
print_success "Type checking passed"

# Run linting
print_status "Running ESLint..."
npm run lint
print_success "Linting passed"

# Build the application
print_status "Building the application..."
npm run build
print_success "Build completed successfully"

# Check if build artifacts exist
if [ ! -d ".next" ]; then
    print_error "Build failed: .next directory not found"
    exit 1
fi

print_success "Build artifacts created successfully"

# Display build information
print_status "Build Information:"
echo "  - Build directory: .next"
echo "  - Port: 3004"
echo "  - Base path: /dashboard"
echo "  - Environment: production"

print_success "🎉 Dashboard App Build Process Completed Successfully!"

echo ""
print_status "To start the application:"
echo "  npm run start"
echo ""
print_status "To build Docker image:"
echo "  npm run build:docker"
echo ""
print_status "To run in development mode:"
echo "  npm run dev"

