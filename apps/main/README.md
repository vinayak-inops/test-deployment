This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Docker Deployment

### Prerequisites

1. Ensure you have the required secret files in the `secrets/` directory:
   - `nextauth_secret.txt` - Your NextAuth secret
   - `database_url.txt` - Database connection URL
   - `api_key.txt` - API key for external services
   - `jwt_secret.txt` - JWT signing secret

2. Set up environment variables (optional, can use defaults):
   ```bash
   export NEXTAUTH_URL=http://your-domain:3000
   export NEXTAUTH_SECRET=your-secret-here
   export NEXT_PUBLIC_API_BASE_URL=http://your-api-server:8000
   export PORT=3000
   ```

### Building and Running with Docker Compose

```bash
# Build and start the application
docker-compose -f docker-compose.main.yml up --build

# Run in detached mode
docker-compose -f docker-compose.main.yml up -d --build

# Stop the application
docker-compose -f docker-compose.main.yml down
```

### Environment Variables

The application supports the following environment variables:

- `NEXTAUTH_URL` - The URL where your app is hosted (default: http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (required, set via Docker secrets)
- `NEXT_PUBLIC_API_BASE_URL` - Base URL for API calls (default: http://192.168.71.20:8000)
- `PORT` - Port to run the application on (default: 3000)

### Configuration Files

- `config/app.env` - Non-sensitive configuration
- `secrets/` - Directory containing sensitive data files

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
