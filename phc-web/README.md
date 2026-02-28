# Bharat CareLink – PHC Dashboard
## AI-Powered Smart Referral & Risk Intelligence Platform

The Bharat CareLink Web App is a **standalone Angular dashboard** designed for Primary Health Centres (PHCs) to manage, triage, and track high-risk patient referrals from ASHA workers.

---

## 🌟 Tech Stack

* **Angular 21** (Standalone components)
* **Angular Material** (Modern UI components)
* **TypeScript**
* **Vitest** (Unit testing)
* **Prettier** (Code formatting)
* **CloudFront & S3** (Optimized production hosting)

---

## 🚀 Quick Start

### Prerequisites
* **Node.js** (LTS recommended)
* **npm** (v11+ recommended)
* **Angular CLI** (v21+ recommended)

### 1. Install Dependencies
```sh
npm install
```

### 2. Start Development Server
```sh
npm start
```
Open [http://localhost:4200/](http://localhost:4200/). The app will automatically reload on source changes.

---

## 🛠️ Configuration

Environment-specific settings (API endpoints, features) are located in `src/environments/`:
- `environment.ts`: Local development
- `environment.prod.ts`: Production (AWS CloudFront / Elastic Beanstalk)

---

## 📦 Common Scripts

```sh
npm start           # Start local development server
npm run build       # Build for development
npm run build:prod  # Build for production
npm test            # Run unit tests with Vitest
```

---

## 🚢 Deployment (AWS)

The frontend is deployed to an S3 bucket and served via CloudFront.

### Manual Sync (Quick Update)
```sh
aws s3 sync dist/phc-web/browser s3://bharat-care-link/web/dev --delete
```

### Automated Deployment Script
Using the centralized infrastructure script from the project root:
```sh
cd ../infrastructure
./deploy-web.sh
```
This script handles the build, S3 sync, and CloudFront invalidation automatically.

---

## 📂 Project Structure

```text
src/                # Application source code
src/app/            # Components, Services, and State
src/environments/   # environment.prod.ts (API URLs)
public/             # Static assets
package.json        # scripts and dependencies
deploy-web.sh       # (Moved to infrastructure/)
```

---

## 🛡️ License & Social Impact

This platform is developed for the **AWS AI for Bharat Hackathon** to reduce maternal and infant mortality through AI-driven referral prioritization.

Copyright © 2026 Bharat CareLink. All rights reserved.
