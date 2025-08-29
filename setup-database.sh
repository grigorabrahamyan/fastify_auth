#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐘 PostgreSQL Database Setup${NC}\n"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}📦 PostgreSQL not found. Installing via Homebrew...${NC}"
    
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}❌ Homebrew not found. Please install Homebrew first:${NC}"
        echo "https://brew.sh/"
        exit 1
    fi
    
    brew install postgresql
    brew services start postgresql
else
    echo -e "${GREEN}✅ PostgreSQL found${NC}"
fi

# Check if PostgreSQL service is running
if ! brew services list | grep postgresql | grep started &> /dev/null; then
    echo -e "${YELLOW}🔧 Starting PostgreSQL service...${NC}"
    brew services start postgresql
fi

echo -e "${GREEN}✅ PostgreSQL service is running${NC}"

# Create database
echo -e "${YELLOW}🗄️ Creating database...${NC}"
createdb auth_db 2>/dev/null || echo -e "${BLUE}💡 Database 'auth_db' already exists${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp env.example .env
    
    # Update database URL in .env
    sed -i '' 's|postgresql://username:password@localhost:5432/auth_db|postgresql://postgres:@localhost:5432/auth_db|' .env
    
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${BLUE}💡 .env file already exists${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}⚙️ Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npx prisma db push

# Seed database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npm run db:seed

echo -e "\n${GREEN}🎉 Database setup completed!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Database:${NC} postgresql://postgres:@localhost:5432/auth_db"
echo -e "${GREEN}🏥 Health:${NC}   http://localhost:3001/health"
echo -e "${GREEN}🎯 Studio:${NC}   npm run db:studio"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${YELLOW}📋 Sample users created:${NC}"
echo -e "- admin@example.com / adminpassword123"
echo -e "- user@example.com / userpassword123"
echo -e "- demo@example.com / demopassword123"
echo -e "\n${GREEN}✅ You can now start the server with: npm run start:dev${NC}" 