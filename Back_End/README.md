# InatGebeya Backend

Powerful and scalable Node.js backend for the InatGebeya E-commerce platform.

## 🚀 Technologies

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MySQL (using `mysql2`)
- **Security:** Helmet, CORS, Express Rate Limit, BcryptJS
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Nodemailer
- **Validation:** Express Validator
- **Logging:** Morgan

## 📋 Prerequisites

- Node.js (>= 14.x)
- MySQL Server
- npm or yarn

## 🛠️ Setup & Installation

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configuration:**
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=inatgebeya
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   
   # Email Configuration
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

## 🏃 Running the Server

- **Development mode (with nodemon):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```
- **Database Seeding:**
  ```bash
  npm run seed
  ```

## 🏗️ Project Structure

- `src/controllers/`: Request handlers
- `src/services/`: Business logic & Database queries
- `src/routes/`: API endpoint definitions
- `src/middleware/`: Security & Auth logic
- `src/config/`: Database and environment config
- `src/utils/`: Helper functions (Email, OTP, etc.)
- `src/scripts/`: Database migrations/scripts

## 🔐 Key Features

- **RBAC (Role Based Access Control):** Admin, Shop Owner, Delivery Person, User.
- **Secure Authentication:** OTP verification for registration and password reset.
- **Inventory Management:** Auto-inactivation of products when stock enters 0.
- **Shop Ownership:** Shop owners can only manage their own products.
- **Order Flow:** Detailed tracking and order history management.
- **Coin System:** User rewards/coins integration.

---
© 2026 InatGebeya Platform
