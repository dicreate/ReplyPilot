# Instagram DM Automation - Deployment Guide

This guide provides comprehensive instructions for deploying the Instagram DM Automation application to production.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Instagram Developer Account with API credentials
- Domain name (for production deployment)
- SSL certificate (recommended for production)

### 1. Environment Setup

1. Copy the production environment template:
   ```bash
   cp .env.production .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   # Required Instagram API credentials
   INSTAGRAM_CLIENT_ID=your_instagram_client_id
   INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
   INSTAGRAM_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback
   
   # Generate a secure JWT secret
   JWT_SECRET=your_very_secure_jwt_secret_key_here
   
   # Database credentials
   MONGO_ROOT_USERNAME=admin
   MONGO_ROOT_PASSWORD=your_secure_password
   
   # Email configuration for notifications
   ADMIN_EMAIL=admin@yourdomain.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

### 2. Deploy with Docker Compose

#### Option A: Using the deployment script (Linux/Mac)
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy the application
./scripts/deploy.sh deploy
```

#### Option B: Manual deployment
```bash
# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Verify Deployment

1. **Health Check**: Visit `http://localhost:5000/health`
2. **Application**: Visit `http://localhost:5000`
3. **API Status**: Visit `http://localhost:5000/health/detailed`

## 📋 Production Deployment

### Domain and SSL Setup

1. **Configure your domain** to point to your server
2. **Update environment variables**:
   ```bash
   FRONTEND_URL=https://yourdomain.com
   INSTAGRAM_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback
   ```

3. **Enable Nginx reverse proxy**:
   ```bash
   docker-compose --profile production up -d
   ```

### Security Considerations

1. **Firewall Configuration**:
   - Only expose ports 80 and 443 to the internet
   - Block direct access to port 5000 and 27017

2. **Database Security**:
   - Use strong passwords
   - Enable MongoDB authentication
   - Consider using MongoDB Atlas for managed hosting

3. **SSL/TLS**:
   - Use Let's Encrypt for free SSL certificates
   - Configure HTTPS redirects
   - Enable HSTS headers

### Monitoring and Logging

1. **Health Monitoring**:
   - Set up monitoring for `/health` endpoint
   - Configure alerts for service failures
   - Monitor resource usage (CPU, memory, disk)

2. **Log Management**:
   ```bash
   # View application logs
   docker-compose logs -f app
   
   # View database logs
   docker-compose logs -f mongodb
   
   # Export logs for analysis
   docker-compose logs --no-color > app-logs.txt
   ```

3. **Backup Strategy**:
   ```bash
   # Create backup
   ./scripts/deploy.sh backup
   
   # Automated backups (add to crontab)
   0 2 * * * /path/to/scripts/deploy.sh backup
   ```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Application port | No | `5000` |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `INSTAGRAM_CLIENT_ID` | Instagram API client ID | Yes | - |
| `INSTAGRAM_CLIENT_SECRET` | Instagram API client secret | Yes | - |
| `INSTAGRAM_REDIRECT_URI` | OAuth redirect URI | Yes | - |
| `FRONTEND_URL` | Frontend application URL | No | `http://localhost:3000` |
| `ADMIN_EMAIL` | Admin email for notifications | No | - |
| `EMAIL_HOST` | SMTP server host | No | - |
| `EMAIL_PORT` | SMTP server port | No | `587` |
| `EMAIL_USER` | SMTP username | No | - |
| `EMAIL_PASS` | SMTP password | No | - |

### Docker Compose Profiles

- **Default**: Basic application with MongoDB
- **Production**: Includes Nginx reverse proxy and SSL

## 🛠 Maintenance

### Common Commands

```bash
# View service status
docker-compose ps

# Restart services
docker-compose restart

# Update application
docker-compose pull
docker-compose up -d --build

# Scale services (if needed)
docker-compose up -d --scale app=2

# Clean up unused resources
docker system prune -f
```

### Database Maintenance

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh

# Create database backup
docker-compose exec mongodb mongodump --out /tmp/backup

# Restore from backup
docker-compose exec mongodb mongorestore /tmp/backup
```

### Troubleshooting

#### Application Won't Start
1. Check logs: `docker-compose logs app`
2. Verify environment variables
3. Ensure MongoDB is running: `docker-compose logs mongodb`

#### Database Connection Issues
1. Check MongoDB logs: `docker-compose logs mongodb`
2. Verify connection string in `.env`
3. Ensure network connectivity: `docker network ls`

#### Instagram API Issues
1. Verify API credentials
2. Check redirect URI configuration
3. Monitor rate limits in application logs

#### Performance Issues
1. Monitor resource usage: `docker stats`
2. Check application metrics: `/health/metrics`
3. Review database indexes and queries

## 📊 Monitoring Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health check |
| `/health/detailed` | Detailed system health |
| `/health/ready` | Kubernetes readiness probe |
| `/health/live` | Kubernetes liveness probe |
| `/health/metrics` | System metrics |

## 🔄 Updates and Rollbacks

### Updating the Application

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Rebuild and deploy**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **Verify deployment**:
   ```bash
   curl http://localhost:5000/health
   ```

### Rollback Strategy

1. **Keep previous images**:
   ```bash
   docker tag current-image:latest previous-image:backup
   ```

2. **Quick rollback**:
   ```bash
   docker-compose down
   docker tag previous-image:backup current-image:latest
   docker-compose up -d
   ```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify configuration settings
4. Check Instagram API status

## 🔐 Security Checklist

- [ ] Strong passwords for all services
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules properly configured
- [ ] Regular security updates applied
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Access logs reviewed regularly
- [ ] Environment variables secured