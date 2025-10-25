/**
 * WebSocket Configuration
 *
 * Centralized configuration for WebSocket connections
 * Can be overridden with environment variables
 */

export const WEBSOCKET_CONFIG = {
  // WebSocket server URL
  url:
    process.env.NEXT_PUBLIC_WS_URL ||
    "ws://localhost:8000/ws/transaction/analyze",

  // Test user ID (should match a valid user in your database)
  testUserId:
    process.env.NEXT_PUBLIC_TEST_USER_ID ||
    "bdd8ced0-6b8d-47e1-9c68-866c080994e8",

  // Connection settings
  maxReconnectAttempts: 3,
  reconnectDelay: 2000, // milliseconds

  // Timeout settings
  connectionTimeout: 10000, // 10 seconds
  messageTimeout: 30000, // 30 seconds
} as const;

export type WebSocketConfig = typeof WEBSOCKET_CONFIG;
