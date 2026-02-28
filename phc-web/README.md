# AITS – MCP Tools Catalog Web App

AITS Web App is a **standalone Angular enterprise application** that provides a user interface for managing and cataloging MCP tools.

---

## Tech Stack

* **Angular 21** (Standalone components)
* **Angular Material** (UI components)
* **TypeScript**
* **Vitest** (Unit testing)
* **Prettier** (Code formatting)

---

## Prerequisites

Make sure you have the following installed on your system:

* **Node.js** (LTS recommended)
* **npm** (v11+ recommended)
* **Angular CLI** (v21+ recommended)

---

## Quick Start

Follow these steps to get the project running locally.

---

## 1. Install Dependencies

Clone the repository and install dependencies:

```sh
npm install
```

---

## 2. Start the Development Server

Run the application in development mode:

```sh
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

---

## 3. Configuration

For environment-specific settings (local, staging, production), refer to the configuration in `src/environments/`.

---

## Common Scripts

```sh
npm start           # Start local development server
npm run build       # Build for development
npm run build:prod  # Build for production
npm test            # Run unit tests with Vitest
```

---

## Project Structure (High-Level)

```text
src/                # Application source code
src/app/            # Main application components and modules
src/environments/   # Environment configurations
public/             # Static assets
package.json        # Dependencies and scripts
```

---

## Development Notes

* This project uses **Standalone Components** as per Angular 19+ best practices.
* Use `ng generate component component-name` to create new components.
* Ensure consistent code style by running Prettier.
* Unit tests are powered by **Vitest**.

**Deploy build to S3**

```sh
aws s3 sync dist/phc-web/browser s3://bharat-care-link/web/dev --delete
```

---

## License

This project contains **proprietary and confidential source code** owned by the Lenovo.

Unauthorized copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited unless explicitly permitted in writing by the Lenovo.

All rights reserved.
