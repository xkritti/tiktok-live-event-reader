# TikTok Live Server

A Node.js server for monitoring TikTok Live streams with REST API and WebSocket support. Built with `tiktok-live-connector@2.0.7-beta1`.

## Features

- **Real-time Events**: Receive live TikTok events (gifts, chats, likes, member joins)
- **REST API**: Connect/disconnect users via HTTP endpoints
- **WebSocket**: Stream events to clients in real-time
- **Single User Mode**: Supports one connection at a time to avoid rate limiting
- **Auto-retry**: Automatic retry with exponential backoff for rate limiting
- **Duplicate Prevention**: Prevents duplicate event processing
- **Graceful Shutdown**: Clean server shutdown with connection cleanup

## Prerequisites

- Node.js >= 14.0.0
- npm (comes with Node.js)
- Stable internet connection

## Installation

```bash
npm install
```

## Quick Start

### Start the Server

```bash
# Start server on port 3000 (default)
node index.js

# Or specify custom port
node index.js 8080
```

### Connect to TikTok User

```bash
# Connect to user
curl -X POST http://localhost:3000/connect/username

# Check status
curl http://localhost:3000/status

# Disconnect
curl -X DELETE http://localhost:3000/connect/username
```

### WebSocket Events

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Handle connection
ws.onopen = () => {
  console.log('Connected to TikTok Live Server');
};

// Handle events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};
```

## Project Structure

```
tiktok-live-example/
├── examples/               # Example implementations
│   ├── client-example.html # HTML client for testing
│   └── README.md          # Examples documentation
├── index.js               # Main entry point
├── tiktok-server.js       # Server implementation
├── package.json          # Dependencies
├── README.md            # This file
└── .gitignore          # Git ignore rules
```

## API Reference

### Single User Mode

The server supports only one TikTok Live connection at a time. Connecting to a new user automatically disconnects the previous user.

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check server status and current user |
| GET | `/test/:username` | Test username before connecting |
| POST | `/connect/:username` | Connect to user (auto-disconnects previous) |
| DELETE | `/connect/:username` | Disconnect current user |
| GET | `/status/:username` | Get specific user status (if current) |
| GET | `/status` | Get current user status |
| POST | `/shutdown` | Shutdown server and disconnect user |

### WebSocket Events

Events are sent via WebSocket in this format:

```json
{
  "type": "gift",
  "username": "example_user",
  "data": {
    "sender": "user123",
    "giftName": "Rose",
    "repeatCount": 1,
    "timestamp": "2025-09-09T18:44:13.511Z"
  }
}
```

**Event Types:** `gift`, `chat`, `like`, `member`, `social`, `error`, `disconnected`, `connection_created`, `connection_closed`

## License

MIT
