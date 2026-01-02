# InatGebeya API Documentation (Exhaustive Reference)

This document provides a 100% complete technical reference for the InatGebeya Backend API.

## Base URL
`http://localhost:5000/api`

## Security & Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (Required for all restricted/protected routes)

---

## 1. System
### Health Check
- **URL:** `GET /health`
- **Description:** Check if server is alive.
- **Sample Success:** `{ "success": true, "status": "OK", "message": "InatGebeya API is running" }`

---

## 2. Authentication
### Register
- **URL:** `POST /auth/register`
- **Body:** `{ "full_name", "email", "password", "phone" (opt) }`
- **Success (201):** `{ "success": true, "message": "...", "data": { "email" } }`

### Login
- **URL:** `POST /auth/login`
- **Body:** `{ "email", "password" }`
- **Success (200):** `{ "token", "user": { "id", "full_name", "role_name", ... } }`

### Password Management
- **Forgot Password:** `POST /auth/forgot-password`. Body: `{ "email" }`
- **Verify OTP:** `POST /auth/verify-otp`. Body: `{ "email", "otp_code" }`
- **Reset Password:** `POST /auth/reset-password`. Body: `{ "verification_token", "newPassword" }`
- **Resend OTP:** `POST /auth/resend-otp`. Body: `{ "email" }`

### Session
- **Logout:** `POST /auth/logout` (Auth required)
- **Me (Current Context):** `GET /auth/me` (Auth required)

---

## 3. Users
- **My Profile:** `GET /users/profile`
- **Update Profile:** `PUT /users/profile`. Body: `{ "full_name", "email", "phone", "password" }` (Email change requires check)
- **List Users (Admin):** `GET /users`. Query: `page`, `limit`, `role`, `search`, `is_active`
- **Get User By ID (Admin):** `GET /users/:id`
- **Create User (Admin):** `POST /users`. Body: `{ "full_name", "email", "password", "phone", "role_name" }`
- **Change Role (Admin):** `PUT /users/:id/role`. Body: `{ "role_name" }`
- **Delete User (Admin):** `DELETE /users/:id` (Hard/Force delete)

---

## 4. Products
### Browsing
- **List Products:** `GET /products`. Query: `page`, `limit`, `category_id`, `shop_id`, `min_price`, `max_price`, `search`, `is_active`
- **Search:** `GET /products/search`. Query: `q` (min 2 chars)
- **Get details:** `GET /products/:id`
- **Get sizes:** `GET /products/:id/sizes`

### Management (Admin/Shop Owner)
- **Create:** `POST /products`. Form-Data: `product_name`, `price`, `description`, `category_id`, `shop_id`, `main_image` (file)
- **Update:** `PUT /products/:id`. Form-Data/JSON: `{ ...updates, main_image (file) }`
- **Toggle Status:** `PUT /products/:id/toggle`. Body: `{ "is_active" }`
- **Update Stock:** `PUT /products/:id/stock`. Body: `{ "stock", "size_id" (opt) }`
- **Add Image:** `POST /products/:id/images`. Form-Data: `image` (file)
- **Add Size:** `POST /products/:id/sizes`. Body: `{ "size_label", "stock" }`
- **Delete:** `DELETE /products/:id` (Forbidden if ordered; deactivate instead)

### Interaction
- **Rate/Review:** `POST /products/:id/rate`. Body: `{ "rating" (1-5), "review" }`

---

## 5. Shops
- **List Shops:** `GET /shops`. Query: `page`, `limit`, `area_id`, `search`, `owner_id`
- **Get details:** `GET /shops/:id`
- **Get shop products:** `GET /shops/:id/products`
- **My Shop (Owner):** `GET /shops/my/shop`
- **Analytics (Admin/Owner):** `GET /shops/:id/analytics`. Returns revenue, order counts, etc.
- **Create (Admin):** `POST /shops`. Body: `{ "shop_name", "owner_id", "area_id" }`
- **Update (Admin/Owner):** `PUT /shops/:id`
- **Delete (Admin):** `DELETE /shops/:id`

---

## 6. Orders
- **Checkout:** `POST /orders`. Body: `{ "shop_id", "delivery_address", "items": [{"product_id", "quantity", "price", "size_id"}], "payment_method" }`
- **My Orders (User):** `GET /orders/my-orders`
- **Shop Orders (Owner):** `GET /orders/shop-orders`
- **All Orders (Admin):** `GET /orders`. Query: `user_id`, `shop_id`, `status`, `start_date`, `end_date`
- **Get by ID:** `GET /orders/:id`
- **Update Status:** `PUT /orders/:id/status`. Body: `{ "status" }`
- **Cancel Order:** `POST /orders/:id/cancel`
- **Return Request:** `POST /orders/return`. Body: `{ "order_item_id", "return_reason" }`

---

## 7. Delivery
### Driver Profiles & Management
- **List Drivers (Admin):** `GET /delivery/delivery-persons`
- **Get Driver Profile:** `GET /delivery/profile`
- **Register Driver (Admin):** `POST /delivery/delivery-persons`. Body: `{ "user_id" (opt), "area_id", "name", "email", "password" }`
- **Update Driver:** `PUT /delivery/delivery-persons/:id`
- **Toggle Active Status:** `PUT /delivery/delivery-persons/:id/status`. Body: `{ "status": "active"|"inactive" }`
- **Delete Driver:** `DELETE /delivery/delivery-persons/:id`

### Assignment & Tracking
- **Pending Deliveries:** `GET /delivery/pending`. (Restricted to driver's area if driver)
- **Assigned Deliveries:** `GET /delivery/assigned`
- **Assign Order:** `POST /delivery/assign`. Body: `{ "order_id", "delivery_person_id" }`
- **Update Step Status:** `PUT /delivery/:id/status`. Body: `{ "status": "assigned"|"picked"|"delivered"|"returned" }`
- **Delivery History:** `GET /delivery/history`.
- **Global Stats:** `GET /delivery/stats`. Query: `delivery_person_id`, `area_id`, `start_date`, `end_date`

---

## 8. Categories & Areas
- **All Categories:** `GET /categories`. Query: `stats=true` (for product counts)
- **Create Category (Admin):** `POST /categories`. Body: `{ "category_name" }`
- **Update Category (Admin):** `PUT /categories/:id`
- **Delete Category (Admin):** `DELETE /categories/:id`
- **All Areas:** `GET /areas`
- **Create Area (Admin):** `POST /areas`. Body: `{ "area_name" }`
- **Update Area (Admin):** `PUT /areas/:id`
- **Delete Area (Admin):** `DELETE /areas/:id`

---

## Standard Response Format
### Success (200 OK / 201 Created)
```json
{
  "success": true,
  "message": "Human readable summary",
  "data": { ... },
  "pagination": { "total": 100, "pages": 5, "current": 1 } (for lists)
}
```

### Error (400, 401, 403, 404, 500)
```json
{
  "success": false,
  "message": "Description of the error",
  "errors": [ { "msg": "Validation specific error", "param": "email" } ]
}
```
