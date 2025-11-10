# NestJS Boilerplate Template

A scalable and production-ready **NestJS** boilerplate built with **TypeScript** for rapid backend development.

> ✅ Features: Auth strategies, CORS, Swagger, rate limiting, guards, payment-ready structure, and user module.

---

## 🚀 Features

- ✅ NestJS (latest version)
- 🔐 Modular authentication system (JWT, HTTP-only cookies, Google OAuth2)
- 📄 Swagger (OpenAPI) documentation
- 🌐 CORS configuration
- 📉 Rate Limiting
- 🔒 Auth Guards & Role-based Authorization
- 💳 Payment-ready architecture
- 🧪 Built-in testing structure
- 🧑 User module with full CRUD + auth endpoints
- 🧰 Pre-configured with ESLint, Prettier
- 🗂️ Scalable folder structure
- 📦 TypeORM + PostgreSQL support

---

## 📁 Folder Structure

```
src/
│
├── common/                 # Common utilities (decorators, guards, interceptors)
├── config/                 # Centralized app config (env, DB, JWT, etc.)
├── modules/
│   ├── auth/               # Auth module (JWT, Google OAuth, etc.)
│   └── users/              # User module (CRUD + /me endpoints)
│
├── app.module.ts           # Root module
├── main.ts                 # Entry point
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/your-org/nestjs-boilerplate.git
cd nestjs-boilerplate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

### 4. Run the app

```bash
npm run start:dev
```

> App will be available at `http://localhost:3000`

---

## 🔐 Authentication

- ✅ JWT Auth with HTTP-only cookies
- 🌐 Google OAuth2 (planned)
- 🔒 Access & refresh token logic
- 🧩 Extensible strategy support (e.g., GitHub, Apple, etc.)

### User Auth Endpoints

| Method | Route            | Description            | Auth Required |
| ------ | ---------------- | ---------------------- | ------------- |
| POST   | `/auth/register` | Register new user      | ❌            |
| POST   | `/auth/login`    | Login with credentials | ❌            |
| POST   | `/auth/logout`   | Logout & clear cookies | ✅            |
| GET    | `/auth/me`       | Get current user info  | ✅            |

---

## 👤 User Module

Example implementation with `UserEntity` using TypeORM.

### Routes

| Method | Route       | Description                 |
| ------ | ----------- | --------------------------- |
| GET    | `/users/me` | Get own profile             |
| PATCH  | `/users/me` | Update own profile          |
| GET    | `/users`    | List all users (admin only) |

---

## 📄 API Documentation

Swagger is available at:

```
http://localhost:3000/api
```

- Auto-generated from decorators
- Includes authentication endpoints
- Includes `Bearer Auth` support

---

## 🌐 CORS Config

CORS is enabled and configured via environment variables. By default, it allows requests from `http://localhost:3000`.

---

## 🚫 Rate Limiting

Implemented using `@nestjs/throttler`.

- Global rate limit: 10 requests per 60 seconds
- Can be customized per route

---

## 🧱 Guards

- **AuthGuard**: Protects routes requiring authentication
- **RolesGuard**: Role-based access control

Add `@Roles('admin')` to controllers to enforce access.

---

## 🏦 Payment-Ready Structure

Under the development

> 🔧 Includes placeholder `payment` module for easy setup.

---

## 🧪 Testing

```bash
npm run test
```
