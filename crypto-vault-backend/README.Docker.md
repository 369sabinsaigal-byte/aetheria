# Aetheria Backend Deployment Guide

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 2: Docker Build & Run
```bash
# Build image
docker build -t aetheria-backend .

# Run container
docker run -d -p 3002:3002 --name aetheria-backend aetheria-backend

# View logs
docker logs -f aetheria-backend
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aetheria

# Redis
REDIS_URL=redis://localhost:6379

# Third-party Services
STRIPE_SECRET_KEY=sk_test_your_stripe_key
CIRCLE_API_KEY=your_circle_api_key
TON_API_KEY=your_ton_api_key
TON_MASTER_WALLET_ADDRESS=your_ton_wallet_address

# Security
JWT_SECRET=your_jwt_secret_key

# Webhooks
WEBHOOK_SECRET=your_webhook_secret
```

### Health Check

The backend includes health check endpoints:

- Application Health: `GET /health`
- Database Health: `GET /health/db`
- Redis Health: `GET /health/redis`

### Monitoring

The application includes:
- Structured logging with timestamps
- Health checks for all services
- Graceful error handling
- Request/response logging

### Scaling

For production deployments:

1. **Horizontal Scaling**: Use multiple container instances behind a load balancer
2. **Database**: Consider using managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
3. **Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
4. **Monitoring**: Integrate with APM tools like New Relic, DataDog, or Prometheus

### Security

- All sensitive data is stored in environment variables
- Database connections use SSL/TLS
- API requests are validated and sanitized
- Rate limiting is implemented for public endpoints
- Webhook endpoints are secured with signatures

### Troubleshooting

#### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3002
   netstat -an | findstr :3002
   # Kill process
   taskkill /PID <pid> /F
   ```

2. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

3. **Redis Connection Issues**
   - Ensure Redis is running
   - Check REDIS_URL format
   - Test Redis connection: `redis-cli ping`

#### Logs

View application logs:
```bash
# Docker logs
docker-compose logs -f backend

# Application logs (if mounted)
tail -f logs/app.log
```

### Support

For issues or questions:
- Check application logs
- Verify environment variables
- Test individual service health
- Review API documentation at `/api/docs` (when available)