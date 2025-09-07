Tradelink Backend (Express)

Overview

- Express API designed to match the frontend at Tradelink-dev.
- Structure: src/models, src/controllers, src/routes.
- Uses MongoDB (Mongoose), JWT auth, Cloudinary for image uploads.

Getting Started

- Copy .env.example to .env and fill values:
  - PORT, MONGODB_URI, JWT_SECRET
  - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  - GMAIL_USER, GMAIL_PASS (use a Gmail App Password)
  - CLIENT_URL (frontend origin like http://localhost:5173)
  - API_BASE_URL (optional; backend origin like http://localhost:5000)

- Install dependencies:
  - npm install

- Run dev server:
  - npm run dev

Routes Implemented

- Auth (base: /api/v1/auth)
  - POST /register
  - GET /verify-email/:token
  - POST /login
  - POST /forgot-password
  - POST /resend-verification
  - POST /logout
  - PUT /reset-password (auth; currentPassword, newPassword)
  - POST /api/v1/reset-password (token + password) — outside /auth to match frontend

- Users (base: /api/v1/users)
  - GET /get/profile
  - PUT /profile/update
  - PUT /change-password
  - DELETE /delete/profile

- Sellers (base: /api/v1/sellers)
  - GET /only/profile
  - GET /get/profile
  - POST /profile/full (multipart; storeLogo)
  - GET /dashboard
  - GET /public/:sellerId
  - GET /search?query=fashion — search by storeName, city, state, businessCategory, services offered

- Products (base: /api/v1/products)
  - GET /
  - POST / (multipart; field: productImg)
  - GET /seller/:sellerId
  - DELETE /:id

- Services (base: /api/v1/services)
  - GET /all
  - POST /create (multipart; field: serviceImg)
  - GET /seller/:sellerId
  - DELETE /:id

- Messages (base: /api/v1/messages)
  - GET /get/conversations
  - GET /get/all/conversations/:userId
  - PATCH /read/:messageId
  - POST /send

Notes

- Email sending uses Gmail via Nodemailer. Generate a Gmail App Password and set GMAIL_USER/GMAIL_PASS. Verification links point to `${CLIENT_URL}/verify-email/:token`, and reset links point to `${CLIENT_URL}/reset-password?token=...`.
- Cloudinary uploads use memory storage and upload_stream. Ensure env vars are set.
- Response shapes conform to the current frontend expectations (e.g., products: { data: [...] }, seller only profile: { success, data: { storeName } }, etc.).

Mapping Highlights (Frontend → Backend)

- axios.ts
  - /api/v1/auth/login → AuthController.login
  - /api/v1/users/get/profile → UserController.getProfile
  - /api/v1/users/profile/update → UserController.updateProfile
  - /api/v1/users/change-password → UserController.changePassword

- Register/Login/Verify/Forgot/Reset
  - POST /api/v1/auth/register → creates user (and seller if provided)
  - GET /api/v1/auth/verify-email/:token → marks emailVerified
  - POST /api/v1/auth/forgot-password → returns reset token (dev)
  - POST /api/v1/reset-password → token + new password
  - PUT /api/v1/auth/reset-password → current + new (auth)

- Products.tsx
  - GET /api/v1/products → { data: [...] }

- UploadProduct.tsx
  - POST /api/v1/products → multipart with productImg
  - POST /api/v1/services/create → multipart with serviceImg

- MyListings.tsx
  - GET /api/v1/products/seller/:sellerId → { products: [...] with id, productImg }
  - GET /api/v1/services/seller/:sellerId → { services: [...] with id, serviceImg }
  - DELETE /api/v1/{products|services}/:id → deletion

- Overview.tsx / Settings.tsx
  - GET /api/v1/sellers/only/profile → { success: true, data: { storeName } }
  - GET /api/v1/sellers/dashboard → { totals, recentMessages, customerReviews }
  - GET /api/v1/sellers/get/profile → full seller profile
  - POST /api/v1/sellers/profile/full → update store profile (storeLogo upload)

- Messages.tsx
  - GET /api/v1/messages/get/conversations → list conversations
  - GET /api/v1/messages/get/all/conversations/:userId → list messages
  - PATCH /api/v1/messages/read/:messageId → mark as read
  - POST /api/v1/messages/send → send message

Local Dev Tips

- Update the frontend baseURL (src/api/axios.ts) to your local API (e.g., http://localhost:5000) for testing.
- Services feature also calls a second base (axios2/fetch). This backend also implements equivalent /api/v1/services routes so you can point axios2 to your local server for unified dev.

API Documentation

- OpenAPI spec is available at docs/openapi.yaml.
- Swagger UI is served at `/api/v1/docs`; raw JSON at `/api/v1/docs.json` when the server is running.
- You can also import docs/openapi.yaml into Postman/Insomnia.
