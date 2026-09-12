#  Bid-Rush — Real-Time Auction Platform

A full-stack real-time auction platform built with MERN stack and Microservices architecture. Users can create auctions, place bids in real-time, and receive instant notifications when outbid or when an auction ends.

---

## Architecture

```
React Frontend (5173)
         ↓
  API Gateway (5000)
         ↓
┌────────┬─────────┬──────────┬──────────────┐
│  Auth  │ Auction │   Bid    │ Notification │
│  5001  │  5002   │  5003    │    5004      │
│   ↓    │    ↓    │    ↓     │      ↓       │
│MongoDB │ MongoDB │ MongoDB  │    Redis     │
│        │         │  +Redis  │   +BullMQ    │
│        │         │  +BullMQ │  +Socket.io  │
└────────┴─────────┴──────────┴──────────────┘
```


---

##  Key Features

-  JWT Authentication with shared middleware across all services
-  Redis Distributed Locking to prevent race conditions during concurrent bidding
-  BullMQ Message Queue for async event-driven notifications
-  Real-time bid updates via Socket.io without page refresh
-  node-cron for automated auction lifecycle management
-  Redis Caching for highest bid queries
-  Automatic winner determination with buyer-seller contact exchange
-  Database-per-Service pattern

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Cache + Queue | Redis (Upstash) + BullMQ |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Scheduler | node-cron |
| HTTP Client | Axios |

---

##  Project Structure

```
bid-rush/
├── gateway/
│   ├── index.js
│   └── .env
├── services/
│   ├── auth-service/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── auction-service/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── bid-service/
│   │   └── src/
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── models/
│   │       └── routes/
│   └── notification-service/
│       ├── index.js
│       ├── worker.js
│       └── redis.js
└── client/
    └── src/
        ├── pages/
        ├── components/
        └── utils/
```

---

##  Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Upstash Redis account

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/lakshaybhardwaj18/bid-rush.git
cd bid-rush
```

**2. Setup environment variables:**

Copy `sample.env` and create `.env` in each service:
gateway/.env

PORT=5000

services/auth-service/.env

PORT=5001
MONGO_URI=your_mongodb_uri/bidrush
JWT_SECRET=your_jwt_secret

services/auction-service/.env

PORT=5002
MONGO_URI=your_mongodb_uri/auction-db
JWT_SECRET=your_jwt_secret
INTERNAL_SECRET=your_internal_secret
REDIS_URL=your_upstash_redis_url

services/bid-service/.env

PORT=5003
MONGO_URI=your_mongodb_uri/bid-db
AUCTION_DB_URI=your_mongodb_uri/auction-db
JWT_SECRET=your_jwt_secret
INTERNAL_SECRET=your_internal_secret
REDIS_URL=your_upstash_redis_url
AUCTION_SERVICE_URL=http://localhost:5002

services/notification-service/.env

PORT=5004
REDIS_URL=your_upstash_redis_url
AUTH_SERVICE_URL=http://localhost:5001

client/.env

VITE_API_URL=http://localhost:5000


**3. Install dependencies:**
```bash
# Gateway
cd gateway && npm install

# Auth Service
cd services/auth-service && npm install

# Auction Service
cd services/auction-service && npm install

# Bid Service
cd services/bid-service && npm install

# Notification Service
cd services/notification-service && npm install

# Frontend
cd client && npm install
```

**4. Run all services** (open 5 terminals):
```bash
# Terminal 1 - Gateway
cd gateway && npm run dev

# Terminal 2 - Auth Service
cd services/auth-service && npm run dev

# Terminal 3 - Auction Service
cd services/auction-service && npm run dev

# Terminal 4 - Bid Service
cd services/bid-service && npm run dev

# Terminal 5 - Notification Service
cd services/notification-service && npm run dev

# Terminal 6 - Frontend
cd client && npm run dev
```

---

##  API Endpoints

### Auth Service
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/profile | Get profile | Yes |
| GET | /api/auth/user/:id | Get user by ID | No |

### Auction Service
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/auctions | Get all auctions | No |
| GET | /api/auctions/:id | Get single auction | No |
| GET | /api/auctions/my | Get my auctions | Yes |
| POST | /api/auctions | Create auction | Yes |
| PUT | /api/auctions/:id | Update auction | Yes |
| DELETE | /api/auctions/:id | Delete auction | Yes |

### Bid Service
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/bids/place | Place a bid | Yes |
| GET | /api/bids/auction/:id | Get auction bids | Yes |
| GET | /api/bids/highest/:id | Get highest bid | Yes |
| GET | /api/bids/my-bids | Get my bids | Yes |

---

##  System Flows

### Bid Flow:

User places bid
→ Redis lock acquired
→ Bid validated against current highest
→ MongoDB transaction (mark old bids outbid, save new bid)
→ Redis cache updated
→ Auction Service updated via HTTP
→ BullMQ job pushed
→ Notification Service broadcasts via Socket.io
→ Redis lock released


### Auction End Flow:

node-cron runs every minute
→ Finds expired auctions
→ Status updated to "ended"
→ Winner determined (highest bidder)
→ Transaction saved to MongoDB
→ BullMQ job pushed
→ Notification Service fetches winner + seller from Auth Service
→ Contact details sent to both via Socket.io


---

##  Team

| Member | Service | Responsibility |
|--------|---------|----------------|
| Member 1 (Lakshay) | Gateway + Auth Service | API routing, JWT auth, user management |
| Member 2 | Auction Service | Auction CRUD, node-cron, winner determination |
| Member 3 | Bid Service | Redis locking, BullMQ producer, MongoDB transactions |
| Member 4 | Notification Service | BullMQ consumer, Socket.io, real-time events |
| Member 5 | React Frontend | UI, Socket.io client, real-time updates |

---

##  Design Patterns Used

- **API Gateway Pattern** — Single entry point for all client requests
- **Database per Service** — Each service owns its own database
- **Event Driven Architecture** — BullMQ for async communication
- **SAGA Pattern** — Multi-step bid placement with Redis lock
- **CQRS Inspired** — Redis as read store, MongoDB as write store

---

## License
MIT License