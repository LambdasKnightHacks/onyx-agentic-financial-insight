const express = require("express");
const plaidController = require("../controllers/plaidController");

const router = express.Router();

// Plaid authentication routes
router.post("/create-link-token", plaidController.createLinkToken);
router.post("/exchange-token", plaidController.exchangeToken);
router.post("/accounts", plaidController.getAccounts);
router.post("/auth", plaidController.getAuthData);

module.exports = router;
