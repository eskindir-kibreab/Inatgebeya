# InatGebeya: Advanced E-commerce Platform

## 🎓 Academic Information
**University:** Wachemo University  
**College:** College of Engineering and Technology  
**Department:** Department of Software Engineering  

### 👥 Project Team
| No | Student Name | ID | Role |
| :--- | :--- | :--- | :--- |
| 1 | **Eskindir Kibreab** | 1501873 | Backend Developer |
| 2 | **Adisu Moga** | 1500632 | Frontend Developer |

---

## 1. System Overview: InatGebeya
**Mission:** To provide a secure, scalable, and multi-vendor e-commerce experience tailored for the local market.

### Core Architecture
- **Frontend:** React 18, Vite, Tailwind CSS (Modern, Responsive, Dark-mode enabled).
- **Backend:** Node.js, Express.js (High-performance API).
- **Database:** MySQL (Relational, ensures data integrity).
- **Security:** Layered protection (JWT, Bcrypt, Helmet, Rate Limiting).

---

## 2. 🌍 Problem Solving & Competitive Advantage
*What makes InatGebeya different from existing local solutions?*

### I. Automated Operations vs. Manual Management
- **The Problem:** Many existing systems list "Out of Stock" products, leading to customer frustration and manual order cancellations.
- **InatGebeya Solution:** Real-time **Stock-to-Status Sync**. When a product's stock hits 0, the system automatically inactivates the listing, ensuring customers only see and purchase available goods.

### II. Multi-Vendor Isolation vs. Shared Environments
- **The Problem:** Generic platforms often have "messy" backends where one vendor might interfere with another's data.
- **InatGebeya Solution:** Strict **Shop Owner Isolation**. Our backend forces filtering at the database level, ensuring Shop Owners see *only* their own inventory and sales, providing a professional and secure SAAS-like experience.

### III. Security & Data Integrity
- **The Problem:** Local platforms often suffer from weak account security (easily hijacked emails) and vague error messages for problematic accounts.
- **InatGebeya Solution:** 
  - **Immutable Identity:** Critical user data (like Email) is locked after registration to prevent account takeover via email switching.
  - **Explicit Access Control:** "Blocked" users receive clear reasons for login failure, reducing support overhead.
  - **OTP Verification:** Robust 2-factor verification for registration and password resets.

### IV. Modern Performance vs. Legacy Systems
- **The Problem:** Older platforms built on Java/JSP or PHP often feel sluggish and outdated.
- **InatGebeya Solution:** **React & Vite** tech stack ensures sub-second page loads and a smooth SPA (Single Page Application) experience, even on slower network connections.

---

## 3. Project Status & Metrics

### Development Progress: **70% Completed**

| Component | Status | Progress (%) |
| :--- | :--- | :--- |
| **Authentication & Security** | Fully Functional (OTP, JWT, Blocked Checks) | 95% |
| **Product & Inventory** | Automated Stock & Active Status Logic | 85% |
| **Cart & Checkout** | Shop Grouping & Shipping Logic (10k Free Threshold) | 90% |
| **User Profile & Activity** | History & Settings implemented | 75% |
| **Admin & Owner Portals** | Core Logic Ready, UI Dashboards Pending | 40% |
| **Third-party Integrations** | Simulation Mode active (Ready for Gateways) | 20% |

---

## 4. "Coming Soon" Features
*Items deferred due to time and resource priority focusing on core transaction stability.*

- **Full Add/Edit Workflow:** Transitioning from the current "Coming Soon" redirect to a full-featured product management suite for sellers.
- **Real-Time Order Tracking:** Map-based delivery updates using local Geo-coordinates.
- **Direct Payment Gateways:** Moving from simulation to Telebirr/CBE Birr integration.
- **Review & Rating System:** Crowdsourced quality control for products and shops.

---
© 2026 InatGebeya Platform | Wachemo University Software Engineering Department
