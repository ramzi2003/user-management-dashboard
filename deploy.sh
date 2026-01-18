#!/bin/bash

# Personal Dashboard Deployment Script for Digital Ocean

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env file with your settings before continuing!${NC}"
    exit 1
fi

# Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker-compose down

# Remove old images (optional - uncomment if needed)
# echo -e "${YELLOW}🗑️  Removing old images...${NC}"
# docker-compose down --rmi all

# Build images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access your application at:"
    echo "   Frontend: http://your-server-ip:3001"
    echo "   Backend API: http://your-server-ip:8081"
    echo ""
    echo "📝 View logs with: docker-compose logs -f"
else
    echo -e "${RED}❌ Deployment failed! Check logs with: docker-compose logs${NC}"
    exit 1
fi

# Create superuser (optional)
read -p "Do you want to create a Django superuser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose exec backend python manage.py createsuperuser
fi

echo -e "${GREEN}🎉 All done!${NC}"
