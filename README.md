# 🍽️ ResQFood AI — Backend API

**AI-powered food redistribution platform** to reduce food wastage and combat food insecurity.

ResQFood AI connects surplus food donors with NGOs and shelters in real-time, facilitating efficient food redistribution through a robust, scalable, and secure digital solution.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Real-time Notifications](#real-time-notifications)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## ✨ Features

- **JWT Authentication** with role-based access control (Donor, NGO, Volunteer, Admin)
- **Donation Management** — Full CRUD with geospatial proximity matching
- **NGO Matching** — Location-based donation discovery using MongoDB 2dsphere indexes
- **Volunteer Workflow** — Task assignment, pickup, and delivery tracking
- **Real-time Notifications** — Socket.IO WebSocket events for instant updates
- **Admin Dashboard API** — User verification, platform oversight, analytics
- **Image Management** — Cloudinary integration for food photos
- **Geolocation Services** — Google Maps API geocoding + Haversine distance calculations
- **Interactive API Docs** — Swagger UI at `/api-docs`
- **Comprehensive Test Suite** — Integration tests with in-memory MongoDB

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | Node.js (≥ 20.19.0) |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB (Mongoose 9.x ODM) |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **Real-time** | Socket.IO 4.x |
| **Validation** | express-validator 7.x |
| **Security** | Helmet, CORS, express-rate-limit |
| **Images** | Cloudinary |
| **Geolocation** | Google Maps Services JS |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) |
| **Testing** | Jest 30.x + Supertest + mongodb-memory-server |

---

## 📁 Project Structure

```
resqfood-backend/
├── src/
│   ├── config/           # Database, Cloudinary, Swagger config
│   ├── controllers/      # Route handler logic
│   ├── middleware/        # Auth, RBAC, validation, error handling
│   ├── models/           # Mongoose schemas (User, Donation, Request, Notification)
│   ├── routes/           # Express routes with Swagger annotations
│   ├── services/         # Business logic layer
│   ├── socket/           # Socket.IO handler
│   ├── utils/            # ApiError, ApiResponse, constants
│   ├── validators/       # express-validator validation chains
│   └── app.js            # Express app setup
├── scripts/
│   └── seedAdmin.js      # Admin user seeder
├── tests/
│   ├── setup.js          # Test environment setup
│   └── integration/      # Integration test suites
├── server.js             # Entry point
├── package.json
├── .env.example
└── jest.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.19.0
- **MongoDB** (local instance or MongoDB Atlas)
- **npm** or **yarn**

### Installation

```bash
# 1. Navigate to project directory
cd resqfood-backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your configuration (see Environment Variables below)

# 4. Seed the admin user
npm run seed

# 5. Start the development server
npm run dev
```

The server will start at `http://localhost:5000`.

### Quick Access

| Resource | URL |
|---|---|
| **API Base** | `http://localhost:5000/api` |
| **API Docs (Swagger)** | `http://localhost:5000/api-docs` |
| **Health Check** | `http://localhost:5000/health` |

---

## 🔧 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/resqfood` |
| `JWT_SECRET` | JWT signing secret (≥ 256-bit) | — |
| `JWT_EXPIRES_IN` | Access token expiry | `1h` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | — |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `*` |

---

## 📖 API Documentation

Interactive API documentation is available via **Swagger UI**:

```
http://localhost:5000/api-docs
```

All endpoints are documented with request/response schemas, example payloads, and authentication requirements.

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login | ❌ |

### User Profile
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users/me` | Get current user profile | ✅ |
| `PUT` | `/api/users/me` | Update profile | ✅ |

### Donations
| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| `POST` | `/api/donations` | Create donation | ✅ | Donor |
| `GET` | `/api/donations/donor` | Get donor's donations | ✅ | Donor |
| `GET` | `/api/donations/available` | Browse nearby donations | ✅ | NGO |
| `GET` | `/api/donations/:id` | Get donation details | ✅ | Any |
| `POST` | `/api/donations/:id/accept` | Accept donation | ✅ | NGO |

### Requests (Pickup/Delivery Tasks)
| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| `GET` | `/api/requests/available` | Browse available tasks | ✅ | Volunteer |
| `GET` | `/api/requests/ngo` | Get NGO's requests | ✅ | NGO |
| `POST` | `/api/requests/:id/assign` | Accept pickup task | ✅ | Volunteer |
| `PUT` | `/api/requests/:id/pickup` | Mark picked up | ✅ | Volunteer |
| `PUT` | `/api/requests/:id/deliver` | Mark delivered | ✅ | Volunteer |

### Admin
| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| `GET` | `/api/admin/users` | Get all users | ✅ | Admin |
| `PUT` | `/api/admin/users/:id/verify` | Verify user | ✅ | Admin |
| `GET` | `/api/admin/donations` | Get all donations | ✅ | Admin |

### Notifications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/notifications/me` | Get unread notifications | ✅ |
| `PUT` | `/api/notifications/:id/read` | Mark as read | ✅ |

---

## 🔔 Real-time Notifications

ResQFood AI uses **Socket.IO** for real-time event delivery.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'your_jwt_token' }
});
```

### Events

| Event | Trigger | Recipients |
|---|---|---|
| `donation_submitted` | New donation created | Nearby NGOs |
| `donation_accepted` | NGO accepts donation | Donor, Admin |
| `volunteer_assigned` | Volunteer takes task | NGO, Volunteer |
| `donation_picked_up` | Volunteer picks up food | Donor, NGO |
| `donation_delivered` | Delivery complete | Donor, NGO, Admin |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test suite
npx jest tests/integration/auth.test.js
npx jest tests/integration/donation.test.js
npx jest tests/integration/request.test.js
npx jest tests/integration/admin.test.js
npx jest tests/integration/notification.test.js
```

Tests use `mongodb-memory-server` for isolated, in-memory MongoDB instances — no external database needed.

---

## 🗄️ Database Schema

### Users
- `username`, `email` (unique), `passwordHash`, `role` (Donor/NGO/Volunteer/Admin)
- `location` (GeoJSON Point with 2dsphere index), `isVerified`, `organizationName`

### Donations
- `donorId`, `foodType`, `quantity`, `unit`, `expiryTime`
- `pickupLocation` (GeoJSON Point with 2dsphere index), `photoUrl`
- `status` (Pending → Accepted → PickedUp → Delivered)

### Requests
- `donationId` (unique), `ngoId`, `volunteerId`
- `status` (Accepted → Assigned → PickedUp → Delivered)
- `statusTimestamps` (acceptedAt, assignedAt, pickedUpAt, deliveredAt)

### Notifications
- `userId`, `message`, `type`, `entityType`, `entityId`, `isRead`

---

## 🚢 Deployment

### Production Build

```bash
# Set environment to production
NODE_ENV=production node server.js
```

### Key Production Considerations

1. **MongoDB Atlas** — Use a managed MongoDB cluster with sharding enabled
2. **Environment Variables** — Use platform-managed secrets (not `.env` files)
3. **HTTPS** — Deploy behind a reverse proxy (nginx/Caddy) with TLS
4. **Rate Limiting** — Configure Redis-backed rate limiting for multi-instance deployments
5. **Socket.IO Scaling** — Use `@socket.io/redis-adapter` for multi-server WebSocket support
6. **Monitoring** — Use the `/health` endpoint with uptime monitoring services

---

## 📄 License

This project is developed as part of an academic project for food waste reduction and hunger relief.

---

**Built with ❤️ to fight food waste and hunger.**
