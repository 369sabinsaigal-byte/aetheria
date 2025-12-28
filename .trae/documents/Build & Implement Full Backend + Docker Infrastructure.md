I will implement the complete Backend and Docker infrastructure to support the Aetheria Card features.

### **1. Backend Transformation (Node.js → TypeScript)**
I will convert the `crypto-vault-backend` to a TypeScript project to support the typed services you requested.

*   **Configuration**: Add `tsconfig.json` and update `package.json` with build scripts.
*   **Dependencies**: Add `typescript`, `ts-node`, `prisma`, and type definitions.
*   **Structure**: Move code to `src/`.

### **2. Implement Backend Services**
I will create the core financial services against the Prisma schema:
*   `src/services/stripeIssuing.ts`: Handles card creation (virtual/physical) and controls (freeze/limits).
*   `src/services/circlePayments.ts`: Manages USDC ↔ USD settlement.
*   `src/services/tonBridge.ts`: Handles TON deposits and conversion to fiat balance.
*   `src/controllers/cardController.ts`: REST API endpoints for the frontend to consume.

### **3. Docker Infrastructure**
I will update the container configuration to build the new TypeScript backend.
*   **Backend Dockerfile**: Update to multi-stage build (install deps → generate prisma → build TS → serve).
*   **Docker Compose**: Ensure `redis` and `backend` services are correctly linked and persisting data.

### **4. Integration**
*   **API Routes**: Expose `/api/cards` endpoints in the backend.
*   **Prisma Client**: Ensure the DB client is generated and usable by the services.

I will begin by setting up the TypeScript environment and then implementing the services.