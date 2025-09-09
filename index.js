#!/usr/bin/env node

const TikTokLiveServer = require('./tiktok-server');

const port = parseInt(process.argv[2]) || 3000;

/**
 * TikTok Live Server - WebSocket server สำหรับจัดการ TikTok Live connections
 */
async function main() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting TikTok Live Server on port ${port}`);

  const server = new TikTokLiveServer(port);

  // จัดการ SIGINT (Ctrl+C) สำหรับ graceful shutdown
  process.on('SIGINT', async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Received shutdown signal...`);

    try {
      await server.shutdown();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during server shutdown:`, error.message);
      process.exit(1);
    }
  });

  // จัดการ SIGTERM
  process.on('SIGTERM', async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Received SIGTERM signal...`);

    try {
      await server.shutdown();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during server shutdown:`, error.message);
      process.exit(1);
    }
  });

  // จัดการ uncaught exceptions
  process.on('uncaughtException', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Uncaught Exception:`, error);
    console.error(error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Unhandled Rejection at:`, promise, 'reason:', reason);
    process.exit(1);
  });

  // จัดการ uncaught exceptions จาก WebSocket
  process.on('warning', (warning) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] Warning:`, warning.message);
  });

  // เริ่ม server
  try {
    await server.start();
    console.log(`[${new Date().toISOString()}] TikTok Live Server is running and ready to accept connections`);
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Failed to start TikTok Live Server:`, error.message);
    process.exit(1);
  }
}

// ทำงานเป็น server หรือ export สำหรับใช้เป็น module
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = TikTokLiveServer;
