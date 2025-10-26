import { Router } from "express";
import plaidController from "../controllers/plaidController";

const router = Router();

// Plaid authentication routes
router.post("/create-link-token", plaidController.createLinkToken);
router.post("/exchange-token", plaidController.exchangeToken);
router.post("/accounts", plaidController.getAccounts);
router.post("/auth", plaidController.getAuthData);

// New routes from plan
router.post("/connect-bank", plaidController.connectBank);
router.post("/webhook", plaidController.webhook);
router.get("/status", plaidController.getStatus);
router.post("/sync-transactions", plaidController.syncTransactions);

// Manually trigger a transaction sync for a user or a specific item
router.post("/transactions/sync", (req, res) =>
  plaidController.syncTransactions(req, res)
);
router.get("/transactions/refresh", (req, res) =>
  plaidController.syncTransactions(req, res)
);

// Create a sandbox transaction for testing
router.get("/sandbox/transactions/create", (req, res) =>
  plaidController.createSandboxTransaction(req, res)
);

router.get("/transactions/refresh", (req, res) =>
  plaidController.syncTransactions(req, res)
);

// Create sandbox transactions for testing
router.get("/sandbox/transactions/create", (req, res) =>
  plaidController.createSandboxTransaction(req, res)
);
export default router;
