# Dashboard App Build Guide

This guide provides comprehensive instructions for building and deploying the Dashboard application.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Docker**: Version 20 or higher (for containerized builds)

## Quick Start

### Development Build
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Using the build script (Linux/macOS)
chmod +x build.sh
./build.sh

# Using the build script (Windows)
build.bat

# Or manually
npm ci
npm run type-check
npm run lint
npm run build
npm run start
```

## Build Scripts

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3004 |
| `npm run build` | Build the application for production |
| `npm run build:docker` | Build and create Docker image |
| `npm run start` | Start production server |
| `npm run start:prod` | Start production server (alias) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean build artifacts |
| `npm run analyze` | Build with bundle analysis |

### Build Process

1. **Dependency Installation**: Installs all required packages
2. **Type Checking**: Validates TypeScript code
3. **Linting**: Checks code quality and style
4. **Building**: Compiles the Next.js application
5. **Optimization**: Optimizes assets and code splitting

## Docker Build

### Building Docker Image
```bash
# Build the Docker image
npm run build:docker

# Or manually
docker build -t dashboard-app .
```

### Running Docker Container
```bash
# Run the container
docker run -p 3004:3004 dashboard-app

# Run with environment variables
docker run -p 3004:3004 -e NODE_ENV=production dashboard-app
```

## Configuration

### Next.js Configuration
The application is configured with:
- **Base Path**: `/dashboard`
- **Asset Prefix**: `/dashboard`
- **Standalone Output**: Enabled for Docker builds
- **Port**: 3004

### Environment Variables
- `NODE_ENV`: Environment (development/production)
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry
- `PORT`: Server port (default: 3004)

## Deployment

### Local Deployment
```bash
# Build and start
npm run build
npm run start
```

### Docker Deployment
```bash
# Build image
docker build -t dashboard-app .

# Run container
docker run -d -p 3004:3004 --name dashboard-app dashboard-app
```

### Production Deployment
1. Build the application: `npm run build`
2. Start the server: `npm run start`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates
5. Configure monitoring and logging

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (requires 18+)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run type-check`

2. **Port Already in Use**
   - Change port in package.json scripts
   - Kill existing process: `lsof -ti:3004 | xargs kill -9`

3. **Docker Build Issues**
   - Ensure Docker is running
   - Check Dockerfile syntax
   - Verify base image availability

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check build output
npm run build -- --debug
```

## Performance Optimization

### Build Optimization
- Uses Next.js standalone output for smaller Docker images
- Implements code splitting and lazy loading
- Optimizes images and assets
- Enables compression and caching

### Runtime Optimization
- Implements proper caching strategies
- Uses CDN for static assets
- Optimizes database queries
- Implements proper error handling

## Monitoring

### Health Checks
- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

### Logging
- Application logs: Console output
- Error logs: Error boundaries and try-catch blocks
- Performance logs: Built-in Next.js analytics

## Security

### Security Headers
- CORS configuration
- Content Security Policy
- X-Frame-Options
- Access Control Headers

### Best Practices
- Environment variable management
- Secure API endpoints
- Input validation
- Authentication and authorization

## Support

For issues and questions:
1. Check this documentation
2. Review build logs
3. Check GitHub issues
4. Contact the development team

