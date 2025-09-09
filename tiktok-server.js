#!/usr/bin/env node

const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');

const port = parseInt(process.argv[2]) || 3000;

class TikTokLiveServer {
  constructor(port = 3000) {
    this.port = port;
    this.currentConnection = null; // Single connection only
    this.currentUsername = null;
    this.processedMessages = new Set(); // Single set for current user
    this.wss = null;
    this.httpServer = null;

    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        currentUser: this.currentUsername,
        isConnected: !!this.currentConnection,
        processedMessages: this.processedMessages.size
      });
    });

    // Test username
    this.app.get('/test/:username', async (req, res) => {
      const { username } = req.params;
      const timestamp = new Date().toISOString();

      try {
        console.log(`[${timestamp}] API: Testing username: ${username}`);

        // Test connection (แต่ไม่สร้างจริง)
        const testConnection = new TikTokLiveConnection(username);
        const state = await testConnection.connect();

        await testConnection.disconnect();

        res.json({
          success: true,
          username,
          roomId: state.roomId,
          isLive: true,
          timestamp
        });

      } catch (error) {
        console.error(`[${timestamp}] API: Test failed for ${username}:`, error.message);

        res.status(400).json({
          success: false,
          username,
          error: error.message,
          timestamp
        });
      }
    });

    // Connect to TikTok Live
    this.app.post('/connect/:username', async (req, res) => {
      const { username } = req.params;
      const timestamp = new Date().toISOString();

      try {
        console.log(`[${timestamp}] API: Connecting to ${username}`);

        // Disconnect existing connection if any
        if (this.currentConnection) {
          console.log(`[${timestamp}] API: Disconnecting existing user: ${this.currentUsername}`);
          await this.currentConnection.disconnect();
          this.currentConnection = null;
          this.currentUsername = null;
          this.processedMessages.clear();
        }

        // Create new connection
        const connection = new TikTokLiveConnection(username);

        // Setup event handlers
        this.setupConnectionEventHandlers(connection, username);

        // Connect with retry logic
        const state = await this.connectWithRetry(connection, username, 3);

        // Store connection
        this.currentConnection = connection;
        this.currentUsername = username;
        this.processedMessages.clear(); // Clear for new user

        // Broadcast connection success
        this.broadcastToClients({
          type: 'connection_created',
          username,
          roomId: state.roomId,
          timestamp
        });

        console.log(`[${timestamp}] API: ✅ Successfully connected to ${username} (Room ID: ${state.roomId})`);

        res.json({
          success: true,
          username,
          roomId: state.roomId,
          message: 'Connected successfully',
          timestamp
        });

      } catch (error) {
        console.error(`[${timestamp}] API: ❌ Failed to connect to ${username}:`, error.message);

        // Broadcast connection error
        this.broadcastToClients({
          type: 'connection_error',
          username,
          error: error.message,
          timestamp
        });

        res.status(500).json({
          success: false,
          username,
          error: error.message,
          suggestions: [
            'Try again in 5-10 minutes',
            'Check if user is currently live',
            'Try a different username'
          ],
          timestamp
        });
      }
    });

    // Disconnect
    this.app.delete('/connect/:username', async (req, res) => {
      const { username } = req.params;
      const timestamp = new Date().toISOString();

      try {
        if (this.currentConnection && this.currentUsername === username) {
          console.log(`[${timestamp}] API: Disconnecting ${username}`);
          await this.currentConnection.disconnect();

          this.broadcastToClients({
            type: 'connection_closed',
            username,
            timestamp
          });

          this.currentConnection = null;
          this.currentUsername = null;
          this.processedMessages.clear();

          console.log(`[${timestamp}] API: ✅ Successfully disconnected ${username}`);

          res.json({
            success: true,
            username,
            message: 'Disconnected successfully',
            timestamp
          });
        } else if (this.currentUsername && this.currentUsername !== username) {
          res.status(400).json({
            success: false,
            requestedUser: username,
            currentUser: this.currentUsername,
            error: 'Different user is currently connected',
            timestamp
          });
        } else {
          res.status(404).json({
            success: false,
            username,
            error: 'No connection found',
            timestamp
          });
        }
      } catch (error) {
        console.error(`[${timestamp}] API: Error disconnecting ${username}:`, error.message);
        res.status(500).json({
          success: false,
          username,
          error: error.message,
          timestamp
        });
      }
    });

    // Get status of specific connection
    this.app.get('/status/:username', (req, res) => {
      const { username } = req.params;
      const timestamp = new Date().toISOString();

      if (this.currentUsername === username) {
        res.json({
          username,
          isConnected: !!this.currentConnection,
          processedMessages: this.processedMessages.size,
          timestamp
        });
      } else {
        res.status(404).json({
          username,
          error: 'User not currently connected',
          currentUser: this.currentUsername,
          timestamp
        });
      }
    });

    // Get status of current connection
    this.app.get('/status', (req, res) => {
      const timestamp = new Date().toISOString();

      res.json({
        server: {
          port: this.port,
          uptime: process.uptime(),
          timestamp
        },
        currentConnection: this.currentUsername ? {
          username: this.currentUsername,
          isConnected: !!this.currentConnection,
          processedMessages: this.processedMessages.size
        } : null,
        singleUserMode: true
      });
    });

    // Shutdown current connection
    this.app.post('/shutdown', async (req, res) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] API: Shutting down current connection`);

      const results = [];

      if (this.currentConnection) {
        try {
          await this.currentConnection.disconnect();
          results.push({
            username: this.currentUsername,
            success: true
          });
        } catch (error) {
          results.push({
            username: this.currentUsername,
            success: false,
            error: error.message
          });
        }

        this.currentConnection = null;
        this.currentUsername = null;
        this.processedMessages.clear();
      }

      this.broadcastToClients({
        type: 'server_shutdown',
        timestamp
      });

      console.log(`[${timestamp}] API: ✅ Server shutdown completed`);

      res.json({
        success: true,
        message: 'Server shutdown completed',
        results,
        timestamp
      });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws) => {
      console.log(`[${new Date().toISOString()}] WebSocket: Client connected`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'subscribe') {
            console.log(`[${new Date().toISOString()}] WebSocket: Client subscribed to ${data.username || 'all'}`);
            // Handle subscription logic here if needed
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] WebSocket: Error parsing message:`, error);
        }
      });

      ws.on('close', () => {
        console.log(`[${new Date().toISOString()}] WebSocket: Client disconnected`);
      });
    });
  }

  async connectWithRetry(connection, username, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] API: Connection attempt ${attempt}/${maxRetries} for ${username}`);

        const state = await connection.connect();
        console.log(`[${timestamp}] API: Connected to ${username} (Room ID: ${state.roomId})`);
        return state;

      } catch (error) {
        lastError = error;
        const timestamp = new Date().toISOString();

        console.error(`[${timestamp}] API: Attempt ${attempt} failed:`, error.message);

        if (error.message.includes('rate limit') || error.message.includes('503')) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`[${timestamp}] API: Waiting ${waitTime/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } else {
          // If it's not a rate limiting error, don't retry
          throw error;
        }
      }
    }

    throw lastError;
  }

  setupConnectionEventHandlers(connection, username) {
    const handleEvent = (eventType, data) => {
      // Create unique identifier for duplicate prevention
      let messageId;
      if (eventType === 'gift' && data.repeatEnd !== undefined) {
        messageId = `${data.groupId}_${data.giftId}_${data.user.userId}_${data.repeatEnd}`;
      } else if (data.event?.msgId) {
        messageId = data.event.msgId;
      } else {
        messageId = `${Date.now()}_${Math.random()}`;
      }

      if (this.processedMessages.has(messageId)) {
        return; // Skip duplicate
      }

      this.processedMessages.add(messageId);

      const timestamp = new Date().toISOString();
      const eventData = {
        type: eventType,
        username,
        data: {
          timestamp
        }
      };

      // Format event data based on type
      if (eventType === 'gift') {
        if (data.repeatEnd === 0) return; // Skip first event in batch

        eventData.data.sender = data.user.uniqueId;
        eventData.data.giftName = data.giftDetails?.giftName || `ID:${data.giftId}`;
        eventData.data.repeatCount = data.repeatCount;

        console.log(`[${timestamp}] 🎁 ${data.user.uniqueId} sent gift ${eventData.data.giftName} x${data.repeatCount}`);

      } else if (eventType === 'chat') {
        eventData.data.sender = data.user.uniqueId;
        eventData.data.message = data.comment;

        console.log(`[${timestamp}] 💬 ${data.user.uniqueId}: ${data.comment}`);

      } else if (eventType === 'like') {
        eventData.data.sender = data.user.uniqueId;
        eventData.data.likeCount = data.likeCount;

        console.log(`[${timestamp}] ❤️ ${data.user.uniqueId} sent ${data.likeCount} likes`);

      } else if (eventType === 'member') {
        eventData.data.sender = data.user.uniqueId;

        console.log(`[${timestamp}] 👥 ${data.user.uniqueId} joined`);

      } else if (eventType === 'social') {
        eventData.data.sender = data.user.uniqueId;

        console.log(`[${timestamp}] 🔗 ${data.user.uniqueId} shared`);
      }

      // Broadcast to WebSocket clients
      this.broadcastToClients(eventData);
    };

    // Setup event listeners
    connection.on(WebcastEvent.GIFT, (data) => handleEvent('gift', data));
    connection.on(WebcastEvent.CHAT, (data) => handleEvent('chat', data));
    connection.on(WebcastEvent.LIKE, (data) => handleEvent('like', data));
    connection.on(WebcastEvent.MEMBER, (data) => handleEvent('member', data));
    connection.on(WebcastEvent.SOCIAL, (data) => handleEvent('social', data));

    // Error handling
    connection.on('error', (err) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ⚠️ Connection error for ${username}:`, err.message);

      this.broadcastToClients({
        type: 'error',
        username,
        error: err.message,
        timestamp
      });
    });

    // Disconnected
    connection.on('disconnected', () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🔌 Disconnected from ${username}`);

      this.broadcastToClients({
        type: 'disconnected',
        username,
        timestamp
      });

      // Clean up - reset to null since it's single user
      this.currentConnection = null;
      this.currentUsername = null;
      this.processedMessages.clear();
    });
  }

  broadcastToClients(message) {
    if (!this.wss) return;

    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  start() {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] 🚀 TikTok Live Server started on port ${this.port}`);
        console.log(`[${timestamp}] 📡 HTTP API: http://localhost:${this.port}`);
        console.log(`[${timestamp}] 🔌 WebSocket: ws://localhost:${this.port}`);
        console.log(`[${timestamp}] 💚 Health check: http://localhost:${this.port}/health`);
        console.log(`[${timestamp}] 🎯 Ready to accept connections!`);
        console.log('');

        resolve();
      });

      // Handle WebSocket upgrade
      this.httpServer.on('upgrade', (request, socket, head) => {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      });
    });
  }

  async shutdown() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🛑 Shutting down server...`);

    // Disconnect current connection
    if (this.currentConnection) {
      try {
        await this.currentConnection.disconnect();
        console.log(`[${timestamp}] ✅ Disconnected ${this.currentUsername}`);
      } catch (error) {
        console.error(`[${timestamp}] ❌ Error disconnecting ${this.currentUsername}:`, error.message);
      }
    }

    this.currentConnection = null;
    this.currentUsername = null;
    this.processedMessages.clear();

    if (this.httpServer) {
      this.httpServer.close();
    }

    console.log(`[${timestamp}] 👋 Server shutdown complete`);
  }
}

// Main function
async function main() {
  const server = new TikTokLiveServer(port);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received shutdown signal...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM signal...');
    await server.shutdown();
    process.exit(0);
  });

  // Start server
  await server.start();
}

// Export for testing
module.exports = TikTokLiveServer;

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
