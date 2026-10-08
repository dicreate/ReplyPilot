#!/bin/bash

# Instagram DM Automation Deployment Script
# This script helps deploy the application to production

set -e  # Exit on any error

echo "🚀 Starting Instagram DM Automation deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please copy .env.production to .env and configure it."
        exit 1
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "All requirements satisfied ✓"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose down --remove-orphans
    
    # Build new images
    print_status "Building application image..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_status "Services started successfully ✓"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            print_status "MongoDB is ready ✓"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "MongoDB failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for application
    print_status "Waiting for application..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            print_status "Application is ready ✓"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Application failed to start within 60 seconds"
        exit 1
    fi
}

# Run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Basic health check
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Basic health check passed ✓"
    else
        print_error "Basic health check failed"
        exit 1
    fi
    
    # Detailed health check
    if curl -f http://localhost:5000/health/detailed > /dev/null 2>&1; then
        print_status "Detailed health check passed ✓"
    else
        print_warning "Detailed health check failed (this might be normal)"
    fi
    
    print_status "Health checks completed ✓"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    print_status "Application URL: http://localhost:5000"
    print_status "Health Check: http://localhost:5000/health"
    print_status "API Documentation: http://localhost:5000/api"
    echo ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop services: docker-compose down"
}

# Backup function
backup_data() {
    print_status "Creating data backup..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="backups/${timestamp}"
    mkdir -p "$backup_dir"
    
    # Backup MongoDB
    docker-compose exec -T mongodb mongodump --out /tmp/backup
    docker cp $(docker-compose ps -q mongodb):/tmp/backup "$backup_dir/mongodb"
    
    print_status "Backup created at $backup_dir ✓"
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            deploy_services
            wait_for_services
            run_health_checks
            show_status
            print_status "🎉 Deployment completed successfully!"
            ;;
        "backup")
            backup_data
            ;;
        "status")
            show_status
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "stop")
            print_status "Stopping services..."
            docker-compose down
            print_status "Services stopped ✓"
            ;;
        "restart")
            print_status "Restarting services..."
            docker-compose restart
            wait_for_services
            run_health_checks
            print_status "Services restarted ✓"
            ;;
        *)
            echo "Usage: $0 {deploy|backup|status|logs|stop|restart}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application (default)"
            echo "  backup   - Create a data backup"
            echo "  status   - Show deployment status"
            echo "  logs     - Show application logs"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"