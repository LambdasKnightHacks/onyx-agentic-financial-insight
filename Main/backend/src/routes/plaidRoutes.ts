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

export default router;
