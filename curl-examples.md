# API Testing with cURL Examples

## Bearer Token Authentication Examples

### 1. Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 2. Login User
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com", 
    "password": "securepassword123"
  }'
```

### 3. Access Protected Route with Bearer Token
```bash
# Replace YOUR_ACCESS_TOKEN with actual token from login/register response
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Handle Expired Token - Refresh Tokens
```bash
# Replace YOUR_REFRESH_TOKEN with actual refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### 5. Test with Invalid/Expired Token
```bash
# This should return 401 Unauthorized
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer invalid.token.here"
```

### 6. Logout (Invalidate Tokens)
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Cookie-Based Authentication Examples

### 1. Register with Cookie Storage
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cookie@example.com",
    "password": "cookiepass123"
  }' \
  -c cookies.txt
```

### 2. Access Protected Route with Cookies
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -b cookies.txt
```

### 3. Refresh Tokens with Cookies
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

## Complete Authentication Flow Example

```bash
#!/bin/bash
echo "=== Complete Authentication Flow ==="

# 1. Register user
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}')

echo "Register Response: $REGISTER_RESPONSE"

# Extract access token (requires jq)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.tokens.accessToken')
echo "Access Token: ${ACCESS_TOKEN:0:50}..."

# 2. Get profile with Bearer token
echo -e "\n2. Getting profile with Bearer token..."
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Profile Response: $PROFILE_RESPONSE"

# 3. Test invalid token
echo -e "\n3. Testing invalid token..."
INVALID_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer invalid.token.here")

echo "Invalid Token Response: $INVALID_RESPONSE"

# 4. Logout
echo -e "\n4. Logging out..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Logout Response: $LOGOUT_RESPONSE"

echo -e "\n=== Flow Complete ==="
```

## Error Responses Examples

### Invalid Credentials (401)
```json
{
  "error": {
    "statusCode": 401,
    "message": "Invalid email or password",
    "code": "AUTHENTICATION_ERROR"
  },
  "timestamp": "2025-08-28T23:41:32.632Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### Expired/Invalid Token (401)
```json
{
  "error": {
    "statusCode": 401,
    "message": "Invalid or expired access token",
    "code": "AUTHENTICATION_ERROR"
  },
  "timestamp": "2025-08-28T23:41:32.632Z",
  "path": "/api/auth/profile",
  "method": "GET"
}
```

### Validation Error (400)
```json
{
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-08-28T23:41:32.632Z",
  "path": "/api/auth/register",
  "method": "POST"
}
```

## Success Response Examples

### Registration Success (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "createdAt": "2025-08-28T23:41:32.632Z",
      "updatedAt": "2025-08-28T23:41:32.632Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Profile Success (200)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "createdAt": "2025-08-28T23:41:32.632Z",
      "updatedAt": "2025-08-28T23:41:32.632Z"
    }
  }
}
```

## Advanced Examples

### Change Password
```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }'
```

### Logout from All Devices
```bash
curl -X POST http://localhost:3001/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Health Check
```bash
curl -X GET http://localhost:3001/health
```

### API Documentation
```bash
curl -X GET http://localhost:3001/
``` 