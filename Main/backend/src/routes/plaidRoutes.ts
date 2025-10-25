import { Router } from "express";
import plaidController from "../controllers/plaidController";

const router = Router();

// Plaid authentication routes
router.post("/create-link-token", plaidController.createLinkToken);
router.post("/exchange-token", plaidController.exchangeToken);
router.post("/accounts", plaidController.getAccounts);
router.post("/auth", plaidController.getAuthData);

export default router;
