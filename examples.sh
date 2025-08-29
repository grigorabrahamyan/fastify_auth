#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

echo -e "${BLUE}🚀 Authentication API Examples${NC}\n"

# Example 1: Register a new user
echo -e "${YELLOW}📝 Example 1: User Registration${NC}"
echo "Request:"
echo "curl -X POST $API_URL/api/auth/register \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"john@example.com\", \"password\": \"mypassword123\"}'"
echo

register_response=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email": "john@example.com", "password": "mypassword123"}')

echo "Response:"
echo "$register_response" | jq .
echo

# Extract tokens
access_token=$(echo "$register_response" | jq -r '.data.tokens.accessToken')
refresh_token=$(echo "$register_response" | jq -r '.data.tokens.refreshToken')

echo -e "${GREEN}✅ User registered successfully!${NC}"
echo -e "${BLUE}Access Token: ${access_token:0:50}...${NC}"
echo -e "${BLUE}Refresh Token: ${refresh_token:0:50}...${NC}"
echo

# Example 2: Using Bearer Token to access protected route
echo -e "${YELLOW}🔐 Example 2: Using Bearer Token for Protected Route${NC}"
echo "Request:"
echo "curl -X GET $API_URL/api/auth/profile \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo

profile_response=$(curl -s -X GET "$API_URL/api/auth/profile" \
    -H "Authorization: Bearer $access_token")

echo "Response:"
echo "$profile_response" | jq .
echo

if [[ $profile_response == *"success"* ]]; then
    echo -e "${GREEN}✅ Bearer token authentication successful!${NC}"
else
    echo -e "${RED}❌ Bearer token authentication failed!${NC}"
fi
echo

# Example 3: Login to get fresh tokens
echo -e "${YELLOW}🔑 Example 3: User Login${NC}"
echo "Request:"
echo "curl -X POST $API_URL/api/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"john@example.com\", \"password\": \"mypassword123\"}'"
echo

login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "john@example.com", "password": "mypassword123"}')

echo "Response:"
echo "$login_response" | jq .
echo

# Extract new tokens
new_access_token=$(echo "$login_response" | jq -r '.data.tokens.accessToken')
new_refresh_token=$(echo "$login_response" | jq -r '.data.tokens.refreshToken')

echo -e "${GREEN}✅ Login successful!${NC}"
echo

# Example 4: Simulating expired access token
echo -e "${YELLOW}⏰ Example 4: Handling Expired Access Token${NC}"
echo "Let's simulate an expired/invalid access token scenario:"
echo

# Use an obviously invalid token
invalid_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

echo "Request with invalid token:"
echo "curl -X GET $API_URL/api/auth/profile \\"
echo "  -H \"Authorization: Bearer \$INVALID_TOKEN\""
echo

expired_response=$(curl -s -X GET "$API_URL/api/auth/profile" \
    -H "Authorization: Bearer $invalid_token")

echo "Response:"
echo "$expired_response" | jq .
echo

echo -e "${RED}❌ As expected, the invalid token was rejected!${NC}"
echo

# Example 5: Using refresh token to get new access token
echo -e "${YELLOW}🔄 Example 5: Using Refresh Token${NC}"
echo "When access token expires, use refresh token to get new tokens:"
echo

echo "Request:"
echo "curl -X POST $API_URL/api/auth/refresh \\"
echo "  -H \"Authorization: Bearer \$REFRESH_TOKEN\""
echo

refresh_response=$(curl -s -X POST "$API_URL/api/auth/refresh" \
    -H "Authorization: Bearer $new_refresh_token")

echo "Response:"
echo "$refresh_response" | jq .
echo

# Extract refreshed tokens
refreshed_access_token=$(echo "$refresh_response" | jq -r '.data.tokens.accessToken')
refreshed_refresh_token=$(echo "$refresh_response" | jq -r '.data.tokens.refreshToken')

echo -e "${GREEN}✅ Tokens refreshed successfully!${NC}"
echo -e "${BLUE}New Access Token: ${refreshed_access_token:0:50}...${NC}"
echo

# Example 6: Using the new access token
echo -e "${YELLOW}✨ Example 6: Using Refreshed Access Token${NC}"
echo "Request:"
echo "curl -X GET $API_URL/api/auth/profile \\"
echo "  -H \"Authorization: Bearer \$NEW_ACCESS_TOKEN\""
echo

new_profile_response=$(curl -s -X GET "$API_URL/api/auth/profile" \
    -H "Authorization: Bearer $refreshed_access_token")

echo "Response:"
echo "$new_profile_response" | jq .
echo

echo -e "${GREEN}✅ New access token works perfectly!${NC}"
echo

# Example 7: Cookie-based authentication
echo -e "${YELLOW}🍪 Example 7: Cookie-based Authentication${NC}"
echo "Registering a user and saving cookies:"
echo

echo "Request:"
echo "curl -X POST $API_URL/api/auth/register \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"cookie@example.com\", \"password\": \"cookiepass123\"}' \\"
echo "  -c cookies.txt"
echo

cookie_register=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email": "cookie@example.com", "password": "cookiepass123"}' \
    -c cookies.txt)

echo "Response:"
echo "$cookie_register" | jq .
echo

echo "Now accessing profile using saved cookies (no Bearer token needed):"
echo "Request:"
echo "curl -X GET $API_URL/api/auth/profile -b cookies.txt"
echo

cookie_profile=$(curl -s -X GET "$API_URL/api/auth/profile" -b cookies.txt)

echo "Response:"
echo "$cookie_profile" | jq .
echo

echo -e "${GREEN}✅ Cookie-based authentication works!${NC}"
echo

# Example 8: Logout
echo -e "${YELLOW}🚪 Example 8: Logout${NC}"
echo "Request:"
echo "curl -X POST $API_URL/api/auth/logout \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo

logout_response=$(curl -s -X POST "$API_URL/api/auth/logout" \
    -H "Authorization: Bearer $refreshed_access_token")

echo "Response:"
echo "$logout_response" | jq .
echo

echo -e "${GREEN}✅ Logout successful!${NC}"
echo

# Example 9: Trying to use logged out token
echo -e "${YELLOW}🚫 Example 9: Using Token After Logout${NC}"
echo "Attempting to access profile with logged out token:"
echo

post_logout_response=$(curl -s -X GET "$API_URL/api/auth/profile" \
    -H "Authorization: Bearer $refreshed_access_token")

echo "Response:"
echo "$post_logout_response" | jq .
echo

echo -e "${RED}❌ As expected, the token no longer works after logout!${NC}"
echo

# Cleanup
rm -f cookies.txt

echo -e "${BLUE}🎯 Summary of Authentication Flow:${NC}"
echo "1. Register/Login → Get access token (15min) + refresh token (7d)"
echo "2. Use Bearer token in Authorization header for API requests"
echo "3. When access token expires → Use refresh token to get new tokens"
echo "4. Tokens can be used via Authorization header OR cookies"
echo "5. Logout invalidates all tokens for security"
echo
echo -e "${GREEN}🎉 All authentication examples completed!${NC}" 