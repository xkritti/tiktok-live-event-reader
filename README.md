# TikTok Live CLI

โปรแกรม CLI แบบง่ายสำหรับรับ TikTok Live events โดยใช้ `tiktok-live-connector@2.0.3`

## ✨ คุณสมบัติ

- 🎁 **Gift Events**: รับและแสดงของขวัญที่ถูกส่งแบบ real-time
- 💬 **Chat Messages**: แสดงข้อความแชทจากผู้ชม
- ❤️ **Like Events**: แสดงจำนวนไลค์ที่ได้รับ
- 👥 **Member Joins**: แสดงเมื่อมีคนเข้าห้อง
- 📊 **Timestamps**: แสดงเวลาที่แม่นยำสำหรับทุก event
- 🛡️ **Duplicate Prevention**: ป้องกัน gift ซ้ำอัตโนมัติ
- 🎨 **Emoji Display**: แสดง emoji ที่สวยงามใน terminal

## 📋 Prerequisites

ก่อนเริ่มใช้งาน ต้องมี:

- ✅ **Node.js** version 14.0.0 หรือใหม่กว่า
- ✅ **npm** (มาพร้อมกับ Node.js)
- ✅ **Internet Connection** ที่เสถียร
- ✅ **Terminal/Command Prompt** ที่รองรับ emoji

## 🚀 การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# ตรวจสอบการติดตั้ง
node --version
npm --version
```

## ⚡ Quick Start (เริ่มใช้งานทันที)

### 🚀 **เริ่มเซิร์ฟเวอร์**

```bash
# เริ่ม server บน port 3000 (default)
node index.js

# หรือกำหนด port เอง
node index.js 8080
```

### 📱 **เชื่อมต่อ TikTok User**

```bash
# เชื่อมต่อ user
curl -X POST http://localhost:3000/connect/clumsyboy_45

# ดูสถานะทั้งหมด
curl http://localhost:3000/status

# ตัดการเชื่อมต่อ
curl -X DELETE http://localhost:3000/connect/clumsyboy_45
```

### 🔌 **รับ Events ผ่าน WebSocket**

```javascript
// เปิด browser console และรัน
const ws = new WebSocket("ws://localhost:3000");

// เมื่อเชื่อมต่อสำเร็จ
ws.onopen = () => {
  console.log("Connected to TikTok Live Server");
};

// รับ events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received event:", data);
};
```

**ผลลัพธ์ที่ได้:**

```
[2025-09-09T18:44:49.843Z] Starting TikTok Live CLI for user: clumsyboy_45
[2025-09-09T18:44:49.843Z] Connecting to TikTok Live...
[2025-09-09T18:44:50.123Z] ✅ Connected to clumsyboy_45 (Room ID: 7548125753365269304)
[2025-09-09T18:44:50.123Z] 🎉 Ready to receive TikTok Live events!
[2025-09-09T18:44:50.123Z] 📺 Press Ctrl+C to stop

[2025-09-09T18:44:51.456Z] 🎁 user123 sent gift Rose x1
[2025-09-09T18:44:52.789Z] 💬 alice: สวัสดีครับ!
[2025-09-09T18:44:53.012Z] ❤️ bob sent 5 likes
[2025-09-09T18:44:54.345Z] 👥 charlie joined
```

## 📁 โครงสร้างโปรเจค

```
tiktok-live-exmaple/
├── examples/               # ตัวอย่างการใช้งาน
│   ├── client-example.html # HTML client สำหรับทดสอบ
│   └── README.md          # คำแนะนำการใช้งาน examples
├── index.js               # Entry point หลัก
├── tiktok-server.js       # Server implementation
├── package.json          # Dependencies และ scripts
├── README.md            # เอกสารนี้
└── .gitignore          # Git ignore rules
```

## 📖 การใช้งาน

### เริ่มใช้งานเซิร์ฟเวอร์

```bash
# เริ่ม server บน port 3000 (default)
node index.js

# หรือกำหนด port เอง
node index.js 8080
```

### ทดสอบด้วย HTML Client

```bash
# เปิด HTML client สำหรับทดสอบ (ต้องเริ่ม server ก่อน)
start examples/client-example.html
```

## 📚 API Documentation

### ⚠️ **Single User Mode**

เซิร์ฟเวอร์นี้รองรับ **การเชื่อมต่อได้ทีละ 1 user** เท่านั้น หากต้องการเชื่อมต่อ user ใหม่ จะ disconnect user เก่าอัตโนมัติ

### HTTP REST API

| Method   | Endpoint             | Description                                            |
| -------- | -------------------- | ------------------------------------------------------ |
| `GET`    | `/health`            | ตรวจสอบสถานะเซิร์ฟเวอร์และ user ปัจจุบัน               |
| `GET`    | `/test/:username`    | ทดสอบ username ก่อนเชื่อมต่อ                           |
| `POST`   | `/connect/:username` | เชื่อมต่อ user ใหม่ (จะ disconnect user เก่าอัตโนมัติ) |
| `DELETE` | `/connect/:username` | ตัดการเชื่อมต่อ user ปัจจุบัน                          |
| `GET`    | `/status/:username`  | ดูสถานะเฉพาะ user (ถ้าเป็น user ปัจจุบัน)              |
| `GET`    | `/status`            | ดูสถานะ user ปัจจุบัน                                  |
| `POST`   | `/shutdown`          | ปิดเซิร์ฟเวอร์และ disconnect user ปัจจุบัน             |

### WebSocket Events

เซิร์ฟเวอร์จะส่ง events ผ่าน WebSocket ในรูปแบบ:

```json
{
  "type": "gift",
  "username": "clumsyboy_45",
  "data": {
    "sender": "user123",
    "giftName": "Rose",
    "repeatCount": 1,
    "timestamp": "2025-09-09T18:44:13.511Z"
  }
}
```

**Event Types:**

- `gift` - ของขวัญที่ถูกส่ง
- `chat` - ข้อความแชท
- `like` - ไลค์
- `member` - สมาชิกเข้าห้อง
- `social` - การแชร์/ติดตาม
- `error` - ข้อผิดพลาด
- `disconnected` - การตัดการเชื่อมต่อ
- `connection_created` - เชื่อมต่อสำเร็จ
- `connection_closed` - ตัดการเชื่อมต่อ

### วิธีการใช้งาน Workflow (Single User):

```bash
# 1. เริ่มเซิร์ฟเวอร์
node index.js

# 2. ตรวจสอบสถานะเซิร์ฟเวอร์
curl http://localhost:3000/health

# 3. เชื่อมต่อ user แรก
curl -X POST http://localhost:3000/connect/clumsyboy_45

# 4. เชื่อมต่อ user ใหม่ (จะ disconnect user เก่าอัตโนมัติ)
curl -X POST http://localhost:3000/connect/another_user

# 5. ดูสถานะ user ปัจจุบัน
curl http://localhost:3000/status

# 6. ใน browser console - เชื่อมต่อ WebSocket
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('🎉 Event:', data);
};

# 7. ตัดการเชื่อมต่อ user ปัจจุบัน
curl -X DELETE http://localhost:3000/connect/another_user

# 8. ปิดเซิร์ฟเวอร์
curl -X POST http://localhost:3000/shutdown
```

## 🛠️ Troubleshooting

### 🚨 **ปัญหา: Rate Limiting**

```
❌ Failed to connect: [Rate Limited] Too many connections started, try again later
```

**วิธีแก้ไข:**

```bash
# 1. รอ 5-10 นาทีแล้วลองใหม่
curl -X POST http://localhost:3000/connect/clumsyboy_45

# 2. หรือใช้ username ที่แตกต่าง
curl -X POST http://localhost:3000/connect/another_user

# 3. Server จะ retry อัตโนมัติด้วย exponential backoff
```

### 🔧 **ปัญหา: Connection Failed**

```
❌ Failed to connect: User not found or invalid
```

**วิธีแก้ไข:**

```bash
# ทดสอบ username ก่อน
curl http://localhost:3000/test/clumsyboy_45

# ถ้าผ่านแล้วค่อยเชื่อมต่อ
curl -X POST http://localhost:3000/connect/clumsyboy_45
```

### 📊 **ปัญหา: User ไม่ได้ไลฟ์อยู่**

```
❌ User is not currently live
```

**วิธีแก้ไข:**

```bash
# ตรวจสอบใน TikTok app ก่อน
# หรือทดสอบก่อนเชื่อมต่อ
curl http://localhost:3000/test/username
```

### ⚠️ **ปัญหา: WebSocket ไม่ทำงาน**

```
❌ Cannot connect to WebSocket
```

**วิธีแก้ไข:**

```bash
# ตรวจสอบว่า server รันอยู่
curl http://localhost:3000/health

# เปิด browser console และเชื่อมต่อ
const ws = new WebSocket('ws://localhost:3000');
```

### 🔄 **ปัญหา: เชื่อมต่อ user ใหม่แล้ว user เก่าไม่ disconnect**

```
❌ เชื่อมต่อ user ใหม่ แต่ user เก่ายังคงส่ง events
```

**วิธีแก้ไข:**
เซิร์ฟเวอร์จะ disconnect user เก่าอัตโนมัติเมื่อเชื่อมต่อ user ใหม่

```bash
# เชื่อมต่อ user ใหม่
curl -X POST http://localhost:3000/connect/new_user

# ตรวจสอบ user ปัจจุบัน
curl http://localhost:3000/status
```

## 🎯 **สรุปฟีเจอร์หลัก**

### ✅ **ทำงานได้จริง** - ไม่ต้องใช้ API key หรือ sign server

### ✅ **Rate limiting handling** - Retry อัตโนมัติด้วย exponential backoff

### ✅ **Single User Mode** - จัดการได้ทีละ 1 connection (เหมาะสมกับ rate limiting)

### ✅ **Auto Disconnect** - Disconnect user เก่าอัตโนมัติเมื่อเชื่อมต่อ user ใหม่

### ✅ **REST API** - เชื่อมต่อ/ตัดการเชื่อมต่อผ่าน HTTP

### ✅ **WebSocket** - รับ events แบบ real-time

### ✅ **Duplicate prevention** - ป้องกัน gift/ข้อความซ้ำ

### ✅ **Graceful shutdown** - จัดการการปิดเซิร์ฟเวอร์อย่างปลอดภัย

## 💡 **ข้อดีของ Single User Mode:**

- ✅ **ไม่ติด rate limiting** - เชื่อมต่อได้ทีละ user
- ✅ **จัดการง่าย** - ไม่ต้องจัดการหลาย connections
- ✅ **เสถียร** - ไม่มี conflict ระหว่าง users
- ✅ **Memory efficient** - ใช้ memory น้อย
- ✅ **Simple API** - API endpoints เรียบง่าย

## 📚 **ตัวอย่างการใช้งาน**

ดูตัวอย่างการใช้งานได้ในโฟลเดอร์ `examples/`:

- **HTML Client**: `examples/client-example.html` - ทดสอบการใช้งานผ่าน UI

**🎉 เซิร์ฟเวอร์พร้อมใช้งานแล้ว! ลองทดสอบดูครับ** 🚀
