require("dotenv").config({ path: "./src/.env" });
const request = require("supertest");
const { v4: uuidv4 } = require("uuid");

const MOCK_USER_ID = uuidv4();
const MOCK_ITEM_ID = "mock-item-id-12345";

// Mock Plaid service methods before any other imports
jest.mock("../src/services/plaidService", () => ({
  exchangeToken: jest.fn().mockResolvedValue({
    data: {
      access_token: "mock-access-token",
      item_id: MOCK_ITEM_ID,
    },
  }),
  saveAccessToken: jest.fn().mockResolvedValue(true),
  getItemStatus: jest.fn().mockResolvedValue({
    hasItems: true,
    items: [{ id: MOCK_ITEM_ID, status: "active" }],
  }),
  getItem: jest.fn().mockResolvedValue({ user_id: MOCK_USER_ID }),
  handleItemError: jest.fn().mockResolvedValue(true),
}));

// Mock TransactionSyncService
jest.mock("../src/services/transactionSyncService", () => ({
  syncTransactions: jest.fn().mockResolvedValue({
    added: 10,
    updated: 5,
    removed: 1,
  }),
}));

const app = require("../src/index").default;

describe("Plaid API Endpoints", () => {
  describe("POST /api/plaid/connect-bank", () => {
    it("should connect a bank account and return success", async () => {
      const res = await request(app).post("/api/plaid/connect-bank").send({
        public_token: "mock-public-token",
        userId: MOCK_USER_ID,
        institution_name: "Mock Bank",
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "Bank account connected successfully"
      );
      expect(res.body).toHaveProperty("item_id", MOCK_ITEM_ID);
    });
  });

  describe("GET /api/plaid/status", () => {
    it("should return the status of a user's Plaid items", async () => {
      const res = await request(app)
        .get("/api/plaid/status")
        .query({ userId: MOCK_USER_ID });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("hasItems", true);
      expect(res.body.items[0]).toHaveProperty("id", MOCK_ITEM_ID);
    });
  });

  describe("POST /api/plaid/sync-transactions", () => {
    it("should manually trigger a transaction sync", async () => {
      const res = await request(app).post("/api/plaid/sync-transactions").send({
        userId: MOCK_USER_ID,
        itemId: MOCK_ITEM_ID,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Transaction sync completed");
      expect(res.body).toHaveProperty("added", 10);
    });
  });

  describe("POST /api/plaid/webhook", () => {
    it("should handle a SYNC_UPDATES_AVAILABLE webhook", async () => {
      const res = await request(app).post("/api/plaid/webhook").send({
        webhook_type: "SYNC_UPDATES_AVAILABLE",
        item_id: MOCK_ITEM_ID,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe("Webhook received");
    });

    it("should handle an ERROR webhook", async () => {
      const res = await request(app)
        .post("/api/plaid/webhook")
        .send({
          webhook_type: "ERROR",
          item_id: MOCK_ITEM_ID,
          error: {
            error_code: "ITEM_ERROR",
            error_message: "Item is in a bad state",
          },
        });
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe("Webhook received");
    });
  });
});
