#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

echo -e "${YELLOW}🧪 Testing Auth API${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
health_response=$(curl -s "$API_URL/health")
if [ $? -eq 0 ] && [[ $health_response == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $health_response"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo

# Test 2: API Documentation
echo -e "${YELLOW}2. Testing API Documentation...${NC}"
docs_response=$(curl -s "$API_URL/")
if [ $? -eq 0 ] && [[ $docs_response == *"Auth API"* ]]; then
    echo -e "${GREEN}✅ API documentation accessible${NC}"
else
    echo -e "${RED}❌ API documentation failed${NC}"
fi
echo

# Test 3: User Registration
echo -e "${YELLOW}3. Testing User Registration...${NC}"
register_response=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "securepassword123"}')

if [ $? -eq 0 ] && [[ $register_response == *"success"* ]]; then
    echo -e "${GREEN}✅ User registration successful${NC}"
    # Extract access token for subsequent tests
    access_token=$(echo "$register_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    refresh_token=$(echo "$register_response" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
    echo "User registered successfully"
else
    echo -e "${RED}❌ User registration failed${NC}"
    echo "Response: $register_response"
    exit 1
fi
echo

# Test 4: User Login
echo -e "${YELLOW}4. Testing User Login...${NC}"
login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "securepassword123"}')

if [ $? -eq 0 ] && [[ $login_response == *"success"* ]]; then
    echo -e "${GREEN}✅ User login successful${NC}"
    # Extract new access token
    access_token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ User login failed${NC}"
    echo "Response: $login_response"
    exit 1
fi
echo

# Test 5: Get Profile (Protected Route)
echo -e "${YELLOW}5. Testing Protected Route (Get Profile)...${NC}"
if [ -n "$access_token" ]; then
    profile_response=$(curl -s -X GET "$API_URL/api/auth/profile" \
        -H "Authorization: Bearer $access_token")
    
    if [ $? -eq 0 ] && [[ $profile_response == *"success"* ]]; then
        echo -e "${GREEN}✅ Profile retrieval successful${NC}"
    else
        echo -e "${RED}❌ Profile retrieval failed${NC}"
        echo "Response: $profile_response"
    fi
else
    echo -e "${RED}❌ No access token available for testing${NC}"
fi
echo

# Test 6: Token Refresh
echo -e "${YELLOW}6. Testing Token Refresh...${NC}"
if [ -n "$refresh_token" ]; then
    refresh_response=$(curl -s -X POST "$API_URL/api/auth/refresh" \
        -H "Authorization: Bearer $refresh_token")
    
    if [ $? -eq 0 ] && [[ $refresh_response == *"success"* ]]; then
        echo -e "${GREEN}✅ Token refresh successful${NC}"
    else
        echo -e "${RED}❌ Token refresh failed${NC}"
        echo "Response: $refresh_response"
    fi
else
    echo -e "${RED}❌ No refresh token available for testing${NC}"
fi
echo

# Test 7: Logout
echo -e "${YELLOW}7. Testing Logout...${NC}"
if [ -n "$access_token" ]; then
    logout_response=$(curl -s -X POST "$API_URL/api/auth/logout" \
        -H "Authorization: Bearer $access_token")
    
    if [ $? -eq 0 ] && [[ $logout_response == *"success"* ]]; then
        echo -e "${GREEN}✅ Logout successful${NC}"
    else
        echo -e "${RED}❌ Logout failed${NC}"
        echo "Response: $logout_response"
    fi
else
    echo -e "${RED}❌ No access token available for testing${NC}"
fi
echo

echo -e "${GREEN}🎉 API testing completed!${NC}" 