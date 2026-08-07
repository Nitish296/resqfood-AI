# ResQFood AI — Frontend Handoff Documentation

Welcome to the **ResQFood AI** backend integration guide. This document contains all the information required by the frontend developer to connect a web application (React, Vue, Next.js, etc.) or mobile application (React Native, Flutter, iOS, Android) to the ResQFood AI backend.

---

# 1. Backend Overview

* **Purpose**: ResQFood AI is an AI-powered food redistribution platform that connects surplus food Donors (restaurants, caterers, individuals) with NGOs/shelters and Volunteer couriers in real time.
* **Technology Stack**: Node.js (≥20.19.0), Express.js 5, Socket.IO 4.8.3, Mongoose 9 ODM.
* **Database Used**: MongoDB with `2dsphere` spatial indexing on GeoJSON point objects for distance-based queries (`$nearSphere`).
* **Authentication Method**: JSON Web Tokens (JWT) signed with HMAC SHA-256 (`Bearer` token in `Authorization` header). Generates 1-hour access tokens and 7-day refresh tokens.
* **Key Dependencies**: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `express-validator`, `socket.io`, `cors`, `helmet`, `express-rate-limit`, `swagger-ui-express`.
* **Backend Architecture**: Modular Controller-Service-Model architecture with express-validator middleware and centralized error handling (`ApiError` & `ApiResponse`). Real-time notification dispatches via Socket.IO rooms.

---

# 2. Base URL

### Development Base URL
`http://localhost:5000/api`

### Health Check Endpoint
`http://localhost:5000/health`

### Interactive Swagger API Documentation
`http://localhost:5000/api-docs`

### Production / Deployed Base URL
`https://<your-render-app-name>.onrender.com/api` *(Set via environment variables on the frontend)*

### Frontend Base URL Configuration
The frontend should construct an API client (e.g. Axios instance) using an environment variable for the base URL:
```javascript
// Example: src/api/client.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

# 3. Complete API List

The backend exposes **18 API Endpoints** + **1 Health Endpoint**:

| Method | Endpoint | Purpose | Auth Required | Role Required |
|---|---|---|---|---|
| `GET` | `/health` | Server status and health check | No | None |
| `POST` | `/api/auth/register` | Register a new user (Donor, NGO, Volunteer) | No | None |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT tokens | No | None |
| `GET` | `/api/users/me` | Fetch authenticated user profile | Yes | Any authenticated user |
| `PUT` | `/api/users/me` | Update authenticated user profile | Yes | Any authenticated user |
| `POST` | `/api/donations` | Create a new food donation | Yes | `Donor` |
| `GET` | `/api/donations/donor` | List donations created by current donor | Yes | `Donor` |
| `GET` | `/api/donations/available` | Find nearby available pending donations | Yes | `NGO` |
| `GET` | `/api/donations/:id` | Get details of a specific donation | Yes | Any authenticated user |
| `POST` | `/api/donations/:id/accept` | NGO accepts a pending donation | Yes | `NGO` |
| `GET` | `/api/requests/available` | Browse unassigned logistics requests | Yes | `Volunteer` |
| `GET` | `/api/requests/ngo` | List requests accepted by current NGO | Yes | `NGO` |
| `POST` | `/api/requests/:id/assign` | Volunteer self-assigns to a delivery task | Yes | `Volunteer` |
| `PUT` | `/api/requests/:id/pickup` | Volunteer marks a task as picked up | Yes | `Volunteer` |
| `PUT` | `/api/requests/:id/deliver` | Volunteer marks a task as delivered | Yes | `Volunteer` |
| `GET` | `/api/admin/users` | List all system users with optional filters | Yes | `Admin` |
| `PUT` | `/api/admin/users/:id/verify` | Verify a user (e.g. NGO verification) | Yes | `Admin` |
| `GET` | `/api/admin/donations` | List all system donations with filters | Yes | `Admin` |
| `GET` | `/api/notifications/me` | List unread notifications for current user | Yes | Any authenticated user |
| `PUT` | `/api/notifications/:id/read` | Mark a notification as read | Yes | Any authenticated user |

---

# 4. Detailed API Documentation

---

### POST `/api/auth/register`

**Purpose:** Register a new user account as a `Donor`, `NGO`, or `Volunteer`.

**Authentication:** Not required.

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "greenbakery",
  "email": "contact@greenbakery.com",
  "password": "Password123!",
  "role": "Donor",
  "organizationName": "Green Bakery Pvt Ltd",
  "contactNumber": "+919876543210",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

*Note: `location` (with `latitude` and `longitude`), `organizationName`, and `contactNumber` are optional.*

**Successful Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "username": "greenbakery",
      "email": "contact@greenbakery.com",
      "role": "Donor",
      "organizationName": "Green Bakery Pvt Ltd",
      "contactNumber": "+919876543210",
      "isVerified": false,
      "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      },
      "_id": "67a5b3c8f1e2d34567890abc",
      "createdAt": "2026-08-05T10:00:00.000Z",
      "updatedAt": "2026-08-05T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**HTTP Status:** `201 Created`

**Error Responses:**
* `400 Bad Request` — Validation failure (weak password, invalid email, username < 3 chars, role not in `['Donor', 'NGO', 'Volunteer']`) or duplicate email/username.

---

### POST `/api/auth/login`

**Purpose:** Authenticate user credentials and receive JWT access token and refresh token.

**Authentication:** Not required.

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "contact@greenbakery.com",
  "password": "Password123!"
}
```

**Successful Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "67a5b3c8f1e2d34567890abc",
      "username": "greenbakery",
      "email": "contact@greenbakery.com",
      "role": "Donor",
      "organizationName": "Green Bakery Pvt Ltd",
      "contactNumber": "+919876543210",
      "isVerified": false,
      "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      },
      "createdAt": "2026-08-05T10:00:00.000Z",
      "updatedAt": "2026-08-05T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `400 Bad Request` — Missing email or password field.
* `401 Unauthorized` — Invalid credentials (wrong password or email not found).

---

### GET `/api/users/me`

**Purpose:** Fetch current authenticated user's profile.

**Authentication:** Required.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** None.

**Successful Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "67a5b3c8f1e2d34567890abc",
    "username": "greenbakery",
    "email": "contact@greenbakery.com",
    "role": "Donor",
    "organizationName": "Green Bakery Pvt Ltd",
    "contactNumber": "+919876543210",
    "isVerified": false,
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716]
    },
    "createdAt": "2026-08-05T10:00:00.000Z",
    "updatedAt": "2026-08-05T10:00:00.000Z"
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `401 Unauthorized` — Missing, expired, or malformed JWT token.
* `404 Not Found` — User account deleted or no longer exists in DB.

---

### PUT `/api/users/me`

**Purpose:** Update profile details for the logged-in user.

**Authentication:** Required.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "greenbakery_updated",
  "organizationName": "Green Bakery Global",
  "contactNumber": "+919876543211",
  "location": {
    "latitude": 12.9720,
    "longitude": 77.5950
  }
}
```
*(All fields in the body are optional for partial updates).*

**Successful Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "67a5b3c8f1e2d34567890abc",
    "username": "greenbakery_updated",
    "email": "contact@greenbakery.com",
    "role": "Donor",
    "organizationName": "Green Bakery Global",
    "contactNumber": "+919876543211",
    "isVerified": false,
    "location": {
      "type": "Point",
      "coordinates": [77.5950, 12.9720]
    },
    "createdAt": "2026-08-05T10:00:00.000Z",
    "updatedAt": "2026-08-05T10:15:00.000Z"
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `401 Unauthorized` — Missing or invalid token.
* `404 Not Found` — User document not found.

---

### POST `/api/donations`

**Purpose:** Create a new food donation listing.

**Authentication:** Required (Role: `Donor`).

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "foodType": "Cooked Rice and Curry",
  "description": "50 fresh meals prepared for lunch event",
  "quantity": 50,
  "unit": "meals",
  "expiryTime": "2026-08-08T18:00:00.000Z",
  "pickupLocation": {
    "address": "123 Indiranagar 100ft Road, Bangalore",
    "latitude": 12.9784,
    "longitude": 77.6408
  },
  "photoUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg"
}
```

*Allowed `unit` values: `'kg'`, `'meals'`, `'servings'`, `'items'`.*

**Successful Response:**
```json
{
  "success": true,
  "message": "Donation created successfully",
  "data": {
    "_id": "67a5c123a1b2c3d4e5f67890",
    "donorId": "67a5b3c8f1e2d34567890abc",
    "foodType": "Cooked Rice and Curry",
    "description": "50 fresh meals prepared for lunch event",
    "quantity": 50,
    "unit": "meals",
    "expiryTime": "2026-08-08T18:00:00.000Z",
    "pickupLocation": {
      "address": "123 Indiranagar 100ft Road, Bangalore",
      "type": "Point",
      "coordinates": [77.6408, 12.9784]
    },
    "photoUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    "status": "Pending",
    "createdAt": "2026-08-05T11:00:00.000Z",
    "updatedAt": "2026-08-05T11:00:00.000Z"
  }
}
```

**HTTP Status:** `201 Created`

**Error Responses:**
* `400 Bad Request` — Missing required fields (`foodType`, `quantity`, `unit`, `expiryTime`, `pickupLocation.address`, `latitude`, `longitude`), invalid quantity (must be ≥ 0.1), or past `expiryTime`.
* `401 Unauthorized` — Missing or invalid token.
* `403 Forbidden` — Authenticated user does not have `Donor` role.

---

### GET `/api/donations/donor`

**Purpose:** Get all donations submitted by the authenticated Donor.

**Authentication:** Required (Role: `Donor`).

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
* `status` *(optional)*: Filter by donation status (`Pending`, `Accepted`, `PickedUp`, `Delivered`, `Expired`, `Cancelled`).

**Example Request:**
`GET /api/donations/donor?status=Pending`

**Successful Response:**
```json
{
  "success": true,
  "message": "Donor donations retrieved successfully",
  "data": [
    {
      "_id": "67a5c123a1b2c3d4e5f67890",
      "donorId": "67a5b3c8f1e2d34567890abc",
      "foodType": "Cooked Rice and Curry",
      "quantity": 50,
      "unit": "meals",
      "expiryTime": "2026-08-08T18:00:00.000Z",
      "pickupLocation": {
        "address": "123 Indiranagar 100ft Road, Bangalore",
        "type": "Point",
        "coordinates": [77.6408, 12.9784]
      },
      "status": "Pending",
      "createdAt": "2026-08-05T11:00:00.000Z",
      "updatedAt": "2026-08-05T11:00:00.000Z"
    }
  ]
}
```

**HTTP Status:** `200 OK`

---

### GET `/api/donations/available`

**Purpose:** Find unaccepted (`Pending`) and unexpired donations near specified geographic coordinates using MongoDB `$nearSphere` geospatial queries.

**Authentication:** Required (Role: `NGO`).

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
* `latitude` *(required)*: Number (-90 to 90)
* `longitude` *(required)*: Number (-180 to 180)
* `radius` *(optional)*: Distance radius in kilometers (default: `10`, range: `0.1` to `100`)
* `foodType` *(optional)*: Search string for regex matching food type

**Example Request:**
`GET /api/donations/available?latitude=12.9716&longitude=77.5946&radius=15&foodType=Rice`

**Successful Response:**
```json
{
  "success": true,
  "message": "Available donations retrieved successfully",
  "data": [
    {
      "_id": "67a5c123a1b2c3d4e5f67890",
      "donorId": {
        "_id": "67a5b3c8f1e2d34567890abc",
        "username": "greenbakery",
        "email": "contact@greenbakery.com",
        "organizationName": "Green Bakery Pvt Ltd",
        "contactNumber": "+919876543210"
      },
      "foodType": "Cooked Rice and Curry",
      "quantity": 50,
      "unit": "meals",
      "expiryTime": "2026-08-08T18:00:00.000Z",
      "pickupLocation": {
        "address": "123 Indiranagar 100ft Road, Bangalore",
        "type": "Point",
        "coordinates": [77.6408, 12.9784]
      },
      "status": "Pending",
      "createdAt": "2026-08-05T11:00:00.000Z"
    }
  ]
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `400 Bad Request` — Missing `latitude` or `longitude`.
* `403 Forbidden` — Authenticated user does not have `NGO` role.

---

### GET `/api/donations/:id`

**Purpose:** Retrieve details for a single donation by ID.

**Authentication:** Required.

**Path Parameters:**
* `id` *(required)*: MongoDB ObjectId string of the donation.

**Successful Response:**
```json
{
  "success": true,
  "message": "Donation details retrieved successfully",
  "data": {
    "_id": "67a5c123a1b2c3d4e5f67890",
    "donorId": {
      "_id": "67a5b3c8f1e2d34567890abc",
      "username": "greenbakery",
      "email": "contact@greenbakery.com",
      "organizationName": "Green Bakery Pvt Ltd",
      "contactNumber": "+919876543210"
    },
    "foodType": "Cooked Rice and Curry",
    "description": "50 fresh meals prepared for lunch event",
    "quantity": 50,
    "unit": "meals",
    "expiryTime": "2026-08-08T18:00:00.000Z",
    "pickupLocation": {
      "address": "123 Indiranagar 100ft Road, Bangalore",
      "type": "Point",
      "coordinates": [77.6408, 12.9784]
    },
    "status": "Pending",
    "createdAt": "2026-08-05T11:00:00.000Z"
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `400 Bad Request` — Invalid MongoDB ObjectId format.
* `404 Not Found` — Donation ID does not exist in DB.

---

### POST `/api/donations/:id/accept`

**Purpose:** NGO claims/accepts a pending donation. Automatically updates donation status to `Accepted` and creates an associated logistics `Request` document.

**Authentication:** Required (Role: `NGO`).

**Path Parameters:**
* `id` *(required)*: Donation ID to accept.

**Successful Response:**
```json
{
  "success": true,
  "message": "Donation accepted successfully",
  "data": {
    "donation": {
      "_id": "67a5c123a1b2c3d4e5f67890",
      "status": "Accepted",
      "acceptedByNgoId": "67a5d999f8e7d6543210fedc"
    },
    "request": {
      "_id": "67a5e444b3c2d10987654321",
      "donationId": "67a5c123a1b2c3d4e5f67890",
      "ngoId": "67a5d999f8e7d6543210fedc",
      "status": "Accepted",
      "statusTimestamps": {
        "acceptedAt": "2026-08-05T12:00:00.000Z"
      },
      "createdAt": "2026-08-05T12:00:00.000Z"
    }
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `400 Bad Request` — Donation is no longer available (already accepted, picked up, or cancelled).
* `403 Forbidden` — Authenticated user does not have `NGO` role.
* `404 Not Found` — Donation ID not found.

---

### GET `/api/requests/available`

**Purpose:** Volunteers search for unassigned logistics delivery tasks near their location.

**Authentication:** Required (Role: `Volunteer`).

**Query Parameters:**
* `latitude` *(required)*: Number
* `longitude` *(required)*: Number
* `radius` *(optional)*: Radius in kilometers (default: `10`)

**Successful Response:**
```json
{
  "success": true,
  "message": "Available requests retrieved successfully",
  "data": [
    {
      "_id": "67a5e444b3c2d10987654321",
      "status": "Accepted",
      "donationId": {
        "_id": "67a5c123a1b2c3d4e5f67890",
        "foodType": "Cooked Rice and Curry",
        "quantity": 50,
        "unit": "meals",
        "pickupLocation": {
          "address": "123 Indiranagar 100ft Road, Bangalore",
          "type": "Point",
          "coordinates": [77.6408, 12.9784]
        }
      },
      "ngoId": {
        "_id": "67a5d999f8e7d6543210fedc",
        "username": "hopefoundation",
        "organizationName": "Hope Shelter Foundation",
        "contactNumber": "+919123456789"
      },
      "statusTimestamps": {
        "acceptedAt": "2026-08-05T12:00:00.000Z"
      }
    }
  ]
}
```

**HTTP Status:** `200 OK`

---

### GET `/api/requests/ngo`

**Purpose:** NGO retrieves all logistics requests they have accepted.

**Authentication:** Required (Role: `NGO`).

**Successful Response:**
```json
{
  "success": true,
  "message": "NGO requests retrieved successfully",
  "data": [
    {
      "_id": "67a5e444b3c2d10987654321",
      "status": "Assigned",
      "donationId": {
        "_id": "67a5c123a1b2c3d4e5f67890",
        "foodType": "Cooked Rice and Curry",
        "quantity": 50,
        "unit": "meals"
      },
      "volunteerId": {
        "_id": "67a5f888e7d6c5b4a3210987",
        "username": "alex_courier",
        "contactNumber": "+919988776655"
      },
      "statusTimestamps": {
        "acceptedAt": "2026-08-05T12:00:00.000Z",
        "assignedAt": "2026-08-05T12:30:00.000Z"
      }
    }
  ]
}
```

**HTTP Status:** `200 OK`

---

### POST `/api/requests/:id/assign`

**Purpose:** Volunteer self-assigns to an unassigned delivery task. Updates request status to `Assigned`.

**Authentication:** Required (Role: `Volunteer`).

**Path Parameters:**
* `id` *(required)*: Request ID.

**Successful Response:**
```json
{
  "success": true,
  "message": "Volunteer assigned successfully",
  "data": {
    "_id": "67a5e444b3c2d10987654321",
    "status": "Assigned",
    "volunteerId": "67a5f888e7d6c5b4a3210987",
    "statusTimestamps": {
      "acceptedAt": "2026-08-05T12:00:00.000Z",
      "assignedAt": "2026-08-05T12:30:00.000Z"
    }
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `400 Bad Request` — Request is no longer available for assignment (already assigned to another volunteer).

---

### PUT `/api/requests/:id/pickup`

**Purpose:** Assigned volunteer marks food as picked up from the donor. Synchronizes donation status to `PickedUp`.

**Authentication:** Required (Role: `Volunteer`).

**Path Parameters:**
* `id` *(required)*: Request ID.

**Successful Response:**
```json
{
  "success": true,
  "message": "Request marked as picked up",
  "data": {
    "_id": "67a5e444b3c2d10987654321",
    "status": "PickedUp",
    "statusTimestamps": {
      "acceptedAt": "2026-08-05T12:00:00.000Z",
      "assignedAt": "2026-08-05T12:30:00.000Z",
      "pickedUpAt": "2026-08-05T13:00:00.000Z"
    }
  }
}
```

**HTTP Status:** `200 OK`

**Error Responses:**
* `400 Bad Request` — Task is not assigned to the calling volunteer or current status is not `Assigned`.

---

### PUT `/api/requests/:id/deliver`

**Purpose:** Assigned volunteer marks food as delivered to the NGO/shelter. Synchronizes donation status to `Delivered`.

**Authentication:** Required (Role: `Volunteer`).

**Path Parameters:**
* `id` *(required)*: Request ID.

**Successful Response:**
```json
{
  "success": true,
  "message": "Request marked as delivered",
  "data": {
    "_id": "67a5e444b3c2d10987654321",
    "status": "Delivered",
    "statusTimestamps": {
      "acceptedAt": "2026-08-05T12:00:00.000Z",
      "assignedAt": "2026-08-05T12:30:00.000Z",
      "pickedUpAt": "2026-08-05T13:00:00.000Z",
      "deliveredAt": "2026-08-05T13:45:00.000Z"
    }
  }
}
```

**HTTP Status:** `200 OK`

---

### GET `/api/admin/users`

**Purpose:** Administrator lists all system users with optional role and verification status filters.

**Authentication:** Required (Role: `Admin`).

**Query Parameters:**
* `role` *(optional)*: Filter by `'Donor'`, `'NGO'`, `'Volunteer'`, or `'Admin'`
* `isVerified` *(optional)*: Filter by boolean (`true` or `false`)

**Successful Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "67a5b3c8f1e2d34567890abc",
      "username": "greenbakery",
      "email": "contact@greenbakery.com",
      "role": "Donor",
      "isVerified": true
    }
  ]
}
```

**HTTP Status:** `200 OK`

---

### PUT `/api/admin/users/:id/verify`

**Purpose:** Administrator verifies an unverified user account (e.g. validating an NGO's credentials).

**Authentication:** Required (Role: `Admin`).

**Path Parameters:**
* `id` *(required)*: User ID to verify.

**Successful Response:**
```json
{
  "success": true,
  "message": "User verified successfully",
  "data": {
    "_id": "67a5b3c8f1e2d34567890abc",
    "username": "hopefoundation",
    "role": "NGO",
    "isVerified": true
  }
}
```

**HTTP Status:** `200 OK`

---

### GET `/api/admin/donations`

**Purpose:** Administrator lists all platform donations with optional status, donor, or NGO filters.

**Authentication:** Required (Role: `Admin`).

**Query Parameters:**
* `status` *(optional)*: Filter by status string
* `donorId` *(optional)*: Filter by donor MongoDB ObjectId
* `ngoId` *(optional)*: Filter by accepted NGO MongoDB ObjectId

**Successful Response:**
```json
{
  "success": true,
  "message": "Donations retrieved successfully",
  "data": [ ... ]
}
```

**HTTP Status:** `200 OK`

---

### GET `/api/notifications/me`

**Purpose:** Retrieve all unread notifications for the currently logged-in user.

**Authentication:** Required.

**Successful Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "67a5f999a8b7c6d5e4f32100",
      "userId": "67a5b3c8f1e2d34567890abc",
      "message": "Your donation 'Cooked Rice and Curry' has been accepted by Hope Shelter Foundation",
      "type": "Update",
      "entityType": "Donation",
      "entityId": "67a5c123a1b2c3d4e5f67890",
      "isRead": false,
      "createdAt": "2026-08-05T12:00:00.000Z"
    }
  ]
}
```

**HTTP Status:** `200 OK`

---

### PUT `/api/notifications/:id/read`

**Purpose:** Mark a specific notification as read (`isRead: true`).

**Authentication:** Required.

**Path Parameters:**
* `id` *(required)*: Notification ID.

**Successful Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "_id": "67a5f999a8b7c6d5e4f32100",
    "isRead": true
  }
}
```

**HTTP Status:** `200 OK`

---

# 5. Authentication Flow

```
1. User Registers (/api/auth/register) OR Logs In (/api/auth/login)
                                │
                                ▼
2. Backend Returns JWT Token (valid for 1 hour)
                                │
                                ▼
3. Frontend Stores Token (e.g. localStorage / EncryptedStorage)
                                │
                                ▼
4. Frontend Attaches Token to Requests:
   Header -> Authorization: Bearer <JWT_TOKEN>
                                │
                                ▼
5. Backend Middleware Decodes Token & Populates req.user
```

* **Token Format**: Standard JWT (HMAC SHA-256).
* **Header Format**: `Authorization: Bearer <JWT_TOKEN>`
* **Refresh Tokens**: Backend returns `refreshToken` (valid for 7 days) during register and login. *(Note: Endpoint for token refresh is pending implementation; re-login is used currently when access token expires).*
* **Guest / Anonymous Auth**: Not supported. All data access requires authentication.
* **OAuth / Google Sign-In**: Not implemented in backend.

---

# 6. User Data Model Structure

```json
{
  "_id": "67a5b3c8f1e2d34567890abc",
  "username": "greenbakery",
  "email": "contact@greenbakery.com",
  "role": "Donor",
  "organizationName": "Green Bakery Pvt Ltd",
  "contactNumber": "+919876543210",
  "isVerified": false,
  "location": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  },
  "createdAt": "2026-08-05T10:00:00.000Z",
  "updatedAt": "2026-08-05T10:00:00.000Z"
}
```

*Note: `passwordHash` and Mongoose internal version `__v` are automatically stripped from all API JSON responses.*

---

# 7. Database Models Summary

### 1. `User` Model
* `username`: String (required, unique, min length: 3)
* `email`: String (required, unique, lowercase)
* `passwordHash`: String (hashed with bcrypt 12 rounds)
* `role`: String (enum: `['Donor', 'NGO', 'Volunteer', 'Admin']`, default/required)
* `organizationName`: String (optional)
* `contactNumber`: String (optional)
* `isVerified`: Boolean (default: `false`)
* `location`: GeoJSON Point `{ type: 'Point', coordinates: [longitude, latitude] }` (2dsphere index)

### 2. `Donation` Model
* `donorId`: ObjectId (ref `User`, required)
* `foodType`: String (required)
* `description`: String (optional)
* `quantity`: Number (required, min: 0.1)
* `unit`: String (required, enum: `['kg', 'meals', 'servings', 'items']`)
* `expiryTime`: Date (required, ISO string)
* `pickupLocation`: Object (required)
  * `address`: String (required)
  * `type`: `'Point'`
  * `coordinates`: `[longitude, latitude]` (2dsphere index)
* `photoUrl`: String (optional)
* `status`: String (enum: `['Pending', 'Accepted', 'PickedUp', 'Delivered', 'Expired', 'Cancelled']`, default: `'Pending'`)
* `acceptedByNgoId`: ObjectId (ref `User`, optional)

### 3. `Request` Model
* `donationId`: ObjectId (ref `Donation`, required, unique 1:1 constraint)
* `ngoId`: ObjectId (ref `User`, required)
* `volunteerId`: ObjectId (ref `User`, optional)
* `status`: String (enum: `['Accepted', 'Assigned', 'PickedUp', 'Delivered', 'Cancelled']`, default: `'Accepted'`)
* `statusTimestamps`: Object
  * `acceptedAt`: Date
  * `assignedAt`: Date
  * `pickedUpAt`: Date
  * `deliveredAt`: Date

### 4. `Notification` Model
* `userId`: ObjectId (ref `User`, required)
* `message`: String (required)
* `type`: String (enum: `['Alert', 'Update', 'System']`, default: `'Update'`)
* `entityType`: String (enum: `['Donation', 'Request', 'User']`)
* `entityId`: ObjectId (optional)
* `isRead`: Boolean (default: `false`)

---

# 8. Frontend Integration Guide

### Axios Client Setup

```javascript
// api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

### Real-Time WebSocket Integration (Socket.IO)

The backend broadcasts real-time notifications over WebSockets.

```javascript
// socket/socketClient.js
import { io } from 'socket.io-client';

export function connectSocket(token) {
  const socket = io('http://localhost:5000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Connected to ResQFood Socket.IO server');
  });

  // Listen for real-time notifications
  socket.on('notification', (notificationData) => {
    console.log('New real-time notification received:', notificationData);
    // Trigger toast or update notification badge UI
  });

  return socket;
}
```

---

# 9. Authentication Headers

All requests to protected routes **MUST** include:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example in raw JavaScript `fetch`:
```javascript
const response = await fetch('http://localhost:5000/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

---

# 10. CORS Configuration

* **Allowed Origins**: Configured dynamically via `ALLOWED_ORIGINS` environment variable in the backend. Defaults to `*` (all origins permitted in development).
* **Credentials Allowed**: `true` (`Access-Control-Allow-Credentials: true`).
* **Headers**: Custom Authorization and Content-Type headers allowed.

---

# 11. File / Image Uploads

* **Status**: Image upload endpoint is **NOT** currently exposed as a multipart endpoint on the backend.
* **Current Photo Flow**: The `photoUrl` field on `POST /api/donations` accepts a direct image URL string (e.g. uploaded directly from the frontend to Cloudinary or S3 using client-side SDKs).
* **Cloudinary Configuration**: Backend has Cloudinary utility set up in `src/config/cloudinary.js`, but frontend should supply URL strings to `photoUrl`.

---

# 12. Pagination / Search / Filtering / Sorting

* **Geospatial Proximity Search**: Implemented on `GET /api/donations/available` and `GET /api/requests/available` via `latitude`, `longitude`, and `radius` parameters.
* **Text Filtering**: `GET /api/donations/available` supports `foodType` regex search.
* **Status Filtering**: `GET /api/donations/donor` supports `?status=Pending`.
* **Admin Filtering**: `GET /api/admin/users` supports `?role=NGO` and `?isVerified=true`.
* **Page-based Pagination**: Not implemented on list endpoints (returns full matching arrays sorted by `createdAt: -1`).

---

# 13. Error Handling

All backend error responses follow a standardized JSON schema:

```json
{
  "success": false,
  "message": "Error description message",
  "errors": []
}
```

### Standard Error Status Codes

| Status Code | Meaning | When It Occurs |
|---|---|---|
| `400 Bad Request` | Validation Error / Bad Input | Invalid fields, password strength failure, donation no longer available, invalid coordinates |
| `401 Unauthorized` | Authentication Failed | Missing or expired JWT token, invalid credentials |
| `403 Forbidden` | Access Denied | Role permission mismatch (e.g. Donor attempting to access NGO endpoint) |
| `404 Not Found` | Resource Missing | Non-existent user ID, donation ID, or request ID |
| `409 Conflict` | Duplicate Resource | Email or username already registered |
| `429 Too Many Requests` | Rate Limit Exceeded | More than 20 auth attempts / 15 min or 100 global requests / 15 min |
| `500 Internal Server Error` | Unexpected Server Failure | Uncaught database exception |

---

# 14. Recommended Frontend Project Structure

```
src/
├── api/
│   ├── client.js           # Axios instance with interceptors
│   ├── auth.js             # register, login, fetchMe
│   ├── donations.js        # createDonation, fetchDonorDonations, fetchAvailable
│   ├── requests.js         # fetchAvailableRequests, assign, pickup, deliver
│   └── admin.js            # fetchUsers, verifyUser, fetchAllDonations
├── assets/                 # Images & icons
├── components/             # Reusable UI cards, modal, navbar, badges
├── context/                # AuthContext & SocketContext
├── hooks/                  # useAuth, useSocket, useDonations
├── pages/                  # Login, Register, DonorDashboard, NgoDashboard, VolunteerDashboard, AdminDashboard
└── utils/                  # Coordinate helpers, date formatters
```

---

# 15. Frontend Environment Variables

Create `.env` in the frontend root directory:

```env
# API Base URL
VITE_API_URL=http://localhost:5000/api

# WebSocket Server URL
VITE_SOCKET_URL=http://localhost:5000
```

---

# 16. Complete Frontend Integration Checklist

- [ ] Setup Axios client with base URL from environment variables
- [ ] Implement JWT token storage (`localStorage` / `EncryptedStorage`) and request interceptor
- [ ] Build Authentication screens (Registration with Role dropdown & Login)
- [ ] Build Donor Dashboard (New donation form with latitude/longitude inputs & donation list)
- [ ] Build NGO Dashboard (Proximity search with radius slider & Accept button)
- [ ] Build Volunteer Dashboard (Task discovery, Self-Assign button, Pickup & Delivery status triggers)
- [ ] Build Admin Panel (User verification table & platform monitoring)
- [ ] Implement Socket.IO real-time notification listener
- [ ] Add global HTTP error handler toast popups (400, 401, 403, 404, 429)

---

# 17. Important Notes & Gotchas

1. **GeoJSON Coordinate Order**: GeoJSON points use **`[longitude, latitude]`** order array in MongoDB, but input forms in API requests expect separate `latitude` and `longitude` numbers:
   ```json
   "pickupLocation": {
     "address": "123 Main St",
     "latitude": 12.9716,
     "longitude": 77.5946
   }
   ```
2. **Role Enums are Case-Sensitive**: Must match `Donor`, `NGO`, `Volunteer`, `Admin` exactly.
3. **Quantity Input**: `quantity` must be a positive number ≥ `0.1`.
4. **Expiry Time**: Must be a future date in valid ISO 8601 string format (e.g. `2026-08-08T18:00:00.000Z`).
5. **Role Security**: Routes strictly enforce roles. A token generated for a `Donor` cannot be used on NGO or Volunteer endpoints.

---

# 18. API Dependency Flow

```
Register (/api/auth/register) OR Login (/api/auth/login)
                     │
                     ▼
             Receive JWT Token
                     │
                     ▼
           Fetch Profile (/api/users/me)
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     [DONOR]       [NGO]     [VOLUNTEER]
        │            │            │
  Create Donation    │            │
(POST /api/donations)│            │
        │            │            │
        ▼            ▼            │
     Discover Available Donations │
   (GET /api/donations/available) │
                     │            │
                     ▼            │
              Accept Donation     │
      (POST /api/donations/:id/accept)
                     │            │
                     └──────┬─────┘
                            ▼
                Browse Available Tasks
              (GET /api/requests/available)
                            │
                            ▼
                   Assign Self to Task
             (POST /api/requests/:id/assign)
                            │
                            ▼
                    Mark Picked Up
              (PUT /api/requests/:id/pickup)
                            │
                            ▼
                    Mark Delivered
              (PUT /api/requests/:id/deliver)
```

---

## FRONTEND DEVELOPER QUICK START

Follow these 5 steps to start integrating immediately:

1. **Start Backend & Check Health**: Run `npm run dev` in backend directory and visit `http://localhost:5000/health`. Verify it returns `{ "success": true }`.
2. **Explore Interactive Docs**: Open `http://localhost:5000/api-docs` in your browser to inspect and try out all API routes live.
3. **Configure API Client**: Create an Axios instance pointing to `http://localhost:5000/api` with an interceptor attaching `Authorization: Bearer <token>`.
4. **Implement Auth Flow**: Connect Registration and Login forms to `POST /api/auth/register` and `POST /api/auth/login`. Store the returned `token`.
5. **Test Role Dashboards**: Login as different roles (`Donor`, `NGO`, `Volunteer`) to test donation creation, NGO claiming, and volunteer delivery workflows.
