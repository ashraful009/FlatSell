# FlatSell — Multi-Vendor Real Estate Marketplace
## Full Implementation Plan (10 Phases)

> **Tech Stack**: MongoDB · Express.js · React (Vite) · Node.js · Tailwind CSS  
> **State**: React Context API (NO Redux) · **API**: Axios + HttpOnly Cookies  
> **Storage**: Cloudinary · **Maps**: Google Places Autocomplete

---

## Architecture Summary

```
FlatSell/
├── backend/                        # Node.js / Express (Feature-Driven)
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/               # controllers, routes, model
│   │   │   ├── users/
│   │   │   ├── companies/
│   │   │   ├── properties/
│   │   │   ├── units/
│   │   │   ├── policies/
│   │   │   └── bookings/
│   │   ├── middleware/             # auth, roles, upload (multer)
│   │   ├── config/                 # db.js, cloudinary.js
│   │   ├── utils/                  # sendEmail.js, generateOTP.js
│   │   └── app.js / server.js
│   └── .env
│
└── frontend/                       # React + Vite (Feature-Sliced)
    ├── src/
    │   ├── app/                    # Router, Providers
    │   ├── pages/                  # Route-level pages
    │   ├── features/               # Domain feature slices
    │   │   ├── auth/
    │   │   ├── vendor/
    │   │   ├── properties/
    │   │   ├── units/
    │   │   └── bookings/
    │   ├── shared/
    │   │   ├── components/         # Navbar, Modal, PropertyCard...
    │   │   ├── hooks/              # useAuth, useAxios
    │   │   ├── context/            # AuthContext
    │   │   └── lib/                # axios instance
    │   └── assets/
    └── .env
```

---

## Phase 1 — Project Scaffolding & Environment Setup

**Goal**: Initialize both backend and frontend projects with correct folder structures and all dependencies installed.

### Backend Setup
#### [NEW] `backend/package.json`
- Install: `express`, `mongoose`, `dotenv`, `cors`, `cookie-parser`, `bcryptjs`, `jsonwebtoken`, `nodemailer`, `multer`, `cloudinary`, `multer-storage-cloudinary`, `express-async-errors`

#### [NEW] `backend/src/app.js`
- Configure Express with `cors` (origin: frontend URL, credentials: true), `cookie-parser`, `express.json()`
- Mount all feature routers under `/api/*`

#### [NEW] `backend/src/server.js`
- Connect to MongoDB then `app.listen()`

#### [NEW] `backend/src/config/db.js`
- Mongoose connection with error handling

#### [NEW] `backend/src/config/cloudinary.js`
- Configure Cloudinary SDK with env vars
- Export a helper: `uploadToCloudinary(file, folder, resource_type)`
- `resource_type: 'auto'` handles both images and PDFs

#### [NEW] `backend/.env`
```
PORT=5000
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=
EMAIL_PASS=
CLIENT_URL=http://localhost:5173
```

### Frontend Setup
#### [NEW] `frontend/` via `npx create vite@latest`
- Install: `react-router-dom`, `axios`, `tailwindcss`, `@react-google-maps/api`

#### [NEW] `frontend/src/shared/lib/axiosInstance.js`
```js
// baseURL: import.meta.env.VITE_API_URL
// withCredentials: true  ← sends HttpOnly cookies automatically
```

---

## Phase 2 — Authentication Backend (User Model, OTP, JWT Cookies)

**Goal**: Full auth system with Email OTP, JWT via HttpOnly cookies, and a `/me` endpoint for session persistence.

### Models
#### [NEW] `backend/src/features/auth/user.model.js`
```
Fields:
  name          String (required)
  email         String (required, unique)
  password      String (hashed, bcrypt)
  roles         [String] enum: ['Super Admin','Company Admin','seller','customer','user']
                default: ['user']
  isVerified    Boolean (default: false)
  otp           String
  otpExpiry     Date
```

### Utilities
#### [NEW] `backend/src/utils/sendEmail.js`
- Nodemailer transporter: `port: 587`, `secure: false` (Gmail App Password safe)
- `sendEmail({ to, subject, html })` exported function

#### [NEW] `backend/src/utils/generateOTP.js`
- Returns a random 6-digit OTP string

### Controllers & Routes
#### [NEW] `backend/src/features/auth/auth.controller.js`
| Endpoint | Action |
|---|---|
| `POST /api/auth/register` | Hash password, generate OTP, sendEmail, save user (unverified) |
| `POST /api/auth/verify-otp` | Compare OTP + expiry, set `isVerified: true`, clear OTP |
| `POST /api/auth/login` | Verify credentials → sign JWT → `res.cookie('token', jwt, { httpOnly: true, sameSite: 'strict', secure: true })` |
| `GET /api/auth/me` | Verify cookie JWT → return `{ user }` (no password) |
| `POST /api/auth/logout` | `res.clearCookie('token')` |

#### [NEW] `backend/src/middleware/auth.middleware.js`
- `protect`: reads `req.cookies.token`, verifies JWT, attaches `req.user`
- `authorize(...roles)`: checks `req.user.roles` contains required role

---

## Phase 3 — Auth Frontend (AuthContext, useAuth, Route Guards)

**Goal**: Global auth state, persistent sessions, role-based route protection.

### Context & Hooks
#### [NEW] `frontend/src/shared/context/AuthContext.jsx`
```jsx
// State: { user, isAuthenticated, loading }
// useEffect on mount → axios.get('/api/auth/me') → populate state (session persistence)
// Actions: login(credentials), logout(), updateUser(data)
```

#### [NEW] `frontend/src/shared/hooks/useAuth.js`
```js
// Returns { user, isAuthenticated, loading, login, logout }
```

### Route Guards
#### [NEW] `frontend/src/app/guards/GuestRoute.jsx`
- If `isAuthenticated === true` → redirect to role-based dashboard
- Role priority map:
  ```
  'Super Admin'    → /super-admin
  'Company Admin'  → /company-admin
  'seller'         → /seller-dashboard
  'customer'/'user'→ /customer-dashboard
  ```

#### [NEW] `frontend/src/app/guards/ProtectedRoute.jsx`
- If not authenticated → redirect to `/login`
- If authenticated but wrong role → redirect to `/unauthorized`

#### [NEW] `frontend/src/app/Router.jsx`
- Wrap Login/Register in `<GuestRoute>`
- Wrap dashboard routes in `<ProtectedRoute allowedRoles={[...]}>`

---

## Phase 4 — Navbar & Core UI Shell

**Goal**: A fully responsive, role-aware Navbar with profile dropdown and conditional "Become a Vendor" button.

#### [NEW] `frontend/src/shared/components/Navbar.jsx`
**Logic Matrix:**
| Auth State | Roles | Shows |
|---|---|---|
| Not logged in | — | Login + Register buttons |
| Logged in | Any | Circular Avatar |
| Avatar clicked | Super Admin | Admin Dashboard link |
| Avatar clicked | Company Admin | Company Dashboard link |
| Avatar clicked | seller | Seller Dashboard link |
| Avatar clicked | user / customer | My Profile link |
| Nav bar | user / customer only | "Become a Vendor" CTA |
| Nav bar | Admin / seller | ❌ No "Become a Vendor" |

- Close dropdown on outside click (`useRef` + `useEffect`)
- Tailwind CSS: glassmorphism navbar, smooth dropdown animation

#### [NEW] `frontend/src/shared/components/Footer.jsx`
- Basic branded footer

#### [NEW] `frontend/src/app/Layout.jsx`
- `<Navbar />` + `<Outlet />` + `<Footer />`

---

## Phase 5 — Vendor Onboarding & Policy Workflow

**Goal**: Scroll-gated T&C modal → Vendor application form with Google Maps + PDF upload.

### Backend
#### [NEW] `backend/src/features/policies/policy.model.js`
```
Fields: roleTarget (String), content (String), updatedAt (Date)
```
#### [NEW] `backend/src/features/policies/policy.routes.js`
- `GET /api/policies/:roleTarget` — public
- `PUT /api/policies/:roleTarget` — protected (Super Admin only)

#### [NEW] `backend/src/features/companies/company.model.js`
```
Fields: name, email, phone, description, location { address, lat, lng },
        tradeLicense (Cloudinary URL, resource_type: 'raw'/'auto'),
        ownerId (ref User), status enum['pending','approved','rejected'],
        approvedAt
```
#### [NEW] `backend/src/features/companies/company.controller.js`
- `POST /api/companies/apply`: multer upload → Cloudinary (PDF, resource_type: 'auto') → save Company → notify Super Admin

### Frontend
#### [NEW] `frontend/src/features/vendor/VendorPolicyModal.jsx`
- Fetch policy via `axios.get('/api/policies/vendor')`
- Fixed-height scrollable `<div>` with `onScroll` handler
- "Continue" button: `disabled` until `scrollTop + clientHeight >= scrollHeight`
- Smooth disabled → enabled transition animation

#### [NEW] `frontend/src/features/vendor/VendorApplicationForm.jsx`
- Fields: Company Name, Email, Phone, Description
- Google Places Autocomplete (`@react-google-maps/api`) for location
- PDF-only file input (`.accept="application/pdf"`)
- Submit via `axios.post('/api/companies/apply', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
- Loading spinner + success message

---

## Phase 6 — Property Listing & Super Admin Approval System

**Goal**: Properties go through a pending → approved/rejected lifecycle controlled by Super Admin.

### Backend
#### [NEW] `backend/src/features/properties/property.model.js`
```
Fields: title, description, price (Number), images [String] (Cloudinary URLs),
        companyId (ref Company), addedBy (ref User),
        status enum['pending','approved','rejected'] default:'pending',
        totalFloors (Number), unitsPerFloor (Number),
        address, city, category enum['apartment','commercial','land'],
        approvedAt, rejectedReason
```
#### [NEW] `backend/src/features/properties/property.routes.js`
| Endpoint | Access |
|---|---|
| `POST /api/properties` | Company Admin / Seller |
| `GET /api/properties/pending` | Super Admin |
| `PUT /api/properties/:id/status` | Super Admin |
| `GET /api/properties/approved` | Public |
| `GET /api/properties/company/:companyId` | Public |
| `GET /api/properties/:id` | Public |

### Frontend
#### [NEW] `frontend/src/features/properties/PropertyRequests.jsx`
- Super Admin component: fetch pending properties in `useEffect`
- Table with property info + Approve/Reject buttons
- Optimistic UI update on action

#### [NEW] `frontend/src/features/properties/AddPropertyForm.jsx`
- Multi-image upload (Cloudinary)
- Inputs: title, price, description, category, totalFloors, unitsPerFloor
- Live preview grid showing how units will look (pre-submit)

---

## Phase 7 — Interactive Floor & Unit Visualizer (Core Magic Feature)

**Goal**: Auto-generate units from building config, display interactive color-coded building grid.

### Backend
#### [NEW] `backend/src/features/units/unit.model.js`
```
Fields: propertyId (ref Property), floorNumber (Number),
        unitName (String, e.g., '1A'), price (Number),
        status enum['available','booked','sold'] default:'available',
        bookedBy (ref User, optional)
```
#### Auto-generation logic inside `property.controller.js`:
```
POST /api/properties:
  if (totalFloors && unitsPerFloor) {
    for floor 1..totalFloors:
      for unit A..Z (by count):
        Unit.create({ propertyId, floorNumber: floor, unitName: `${floor}${letter}` })
  }
```
#### [NEW] `backend/src/features/units/unit.routes.js`
- `GET /api/properties/:id/units` — fetch all units sorted by floorNumber

### Frontend
#### [NEW] `frontend/src/features/units/PropertyVisualizer.jsx`
- `useEffect` → `axios.get('/api/properties/:id/units')`
- Group units by `floorNumber` → render floor rows
- Color system:
  ```
  available → bg-green-500
  booked    → bg-yellow-500
  sold      → bg-red-500 (pointer-events-none)
  ```
- Click available unit → Modal with unitName, price, "Request Booking" button
- Clean building cross-section grid using Tailwind CSS Grid

#### [NEW] `frontend/src/features/units/UnitBookingModal.jsx`
- Displays unit details
- "Request Booking" → `POST /api/bookings` (Phase 8)

---

## Phase 8 — Public Pages (Homepage, Companies Directory, Storefront)

**Goal**: Customer-facing pages for browsing properties and company storefronts.

### Frontend Pages
#### [NEW] `frontend/src/pages/HomePage.jsx`
- Hero section + Featured Properties
- `axios.get('/api/properties/approved')` → `<PropertyCard />` grid
- Clicking card → `navigate('/property/:id')`

#### [NEW] `frontend/src/shared/components/PropertyCard.jsx`
- Image, Title, Price, City, Status badge, Company name
- Hover animation, glassmorphism card

#### [NEW] `frontend/src/pages/PropertyDetails.jsx`
- Full property info + image gallery
- `<PropertyVisualizer />` component embedded below details
- Company info snippet (link to storefront)

#### [NEW] `frontend/src/pages/AllCompanies.jsx`
- `axios.get('/api/companies/approved')` → company cards grid
- Click → `navigate('/company/:id')`

#### [NEW] `frontend/src/pages/CompanyStorefront.jsx`
- `useParams()` → companyId
- Parallel requests: `axios.all([getCompany, getCompanyProperties])`
- Branded header (logo, name, location) + property grid below

---

## Phase 9 — Booking System & Dashboards

**Goal**: Booking request flow + isolated, role-based dashboards for all user types.

### Backend
#### [NEW] `backend/src/features/bookings/booking.model.js`
```
Fields: unitId (ref Unit), propertyId (ref Property), companyId (ref Company),
        customerId (ref User), status enum['pending','confirmed','cancelled'],
        requestedAt, message
```
#### [NEW] `backend/src/features/bookings/booking.routes.js`
- `POST /api/bookings` — Customer (creates booking, sets unit to 'booked')
- `GET /api/bookings/company` — Company Admin (see incoming bookings)
- `PUT /api/bookings/:id/status` — Company Admin (confirm/cancel)
- `GET /api/bookings/my` — Customer (see own bookings)

### Frontend Dashboards (4 Isolated Dashboards)
#### [NEW] `frontend/src/pages/dashboards/SuperAdminDashboard.jsx`
- Stats cards, Property Requests panel, Company Approvals panel, Policy Editor

#### [NEW] `frontend/src/pages/dashboards/CompanyAdminDashboard.jsx`
- My Properties, Add Property, Sellers Management, Incoming Bookings

#### [NEW] `frontend/src/pages/dashboards/SellerDashboard.jsx`
- Assigned Properties, Leads, Booking Requests

#### [NEW] `frontend/src/pages/dashboards/CustomerDashboard.jsx`
- Saved Properties, My Bookings, Profile Edit

---

## Phase 10 — Polish, Security & Deployment Preparation

**Goal**: Production-hardening, error handling, performance, and deployment config.

### Backend Security & Polish
- **Rate Limiting**: `express-rate-limit` on auth routes
- **Input Validation**: `express-validator` on all POST/PUT routes
- **Global Error Handler**: `middleware/errorHandler.js`
- **Helmet.js**: HTTP security headers
- **CORS**: Whitelist only frontend domain in production

### Frontend Polish
- **Loading Skeletons**: Replace spinners with skeleton cards
- **Toast Notifications**: `react-hot-toast` for success/error feedback
- **404 Page**: Custom not-found page
- **SEO**: Meta tags per page via `react-helmet-async`
- **Responsive**: Mobile-first review across all pages

### Deployment
- **Backend**: Railway / Render — `NODE_ENV=production`
- **Frontend**: Vercel — `VITE_API_URL=https://your-backend.com`
- **MongoDB**: Atlas cluster
- **Cloudinary**: Production bucket

---

## Phase Summary Table

| Phase | Area | Key Deliverables |
|:---:|---|---|
| **1** | Scaffolding | Folder structure, env config, Cloudinary config, Axios instance |
| **2** | Auth Backend | User model, OTP email, JWT cookies, `/me` endpoint |
| **3** | Auth Frontend | AuthContext, useAuth hook, GuestRoute, ProtectedRoute |
| **4** | Navbar & Shell | Role-aware navbar, dropdown, "Become a Vendor" logic |
| **5** | Vendor Onboarding | Policy modal (scroll-gate), Application form + PDF upload |
| **6** | Property System | Property model, CRUD, Super Admin approval panel |
| **7** | Unit Visualizer ✨ | Auto-generate units, color-coded building grid, booking modal |
| **8** | Public Pages | Homepage, Property details, Companies directory, Storefront |
| **9** | Booking & Dashboards | Booking system, 4 role-based isolated dashboards |
| **10** | Polish & Deploy | Security hardening, skeletons, toasts, deployment config |

---

> [!IMPORTANT]
> **Awaiting your approval to begin Phase 1.**
> Once you confirm, I'll start building immediately — phase by phase, in order.
> You can also request adjustments to any phase before we begin.
