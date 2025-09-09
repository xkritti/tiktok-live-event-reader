# Examples Directory

โฟลเดอร์นี้ประกอบด้วยตัวอย่างการใช้งาน TikTok Live Server

## ไฟล์ในโฟลเดอร์นี้:

### client-example.html
ตัวอย่าง HTML client สำหรับทดสอบการใช้งาน REST API และ WebSocket ของ TikTok Live Server

**วิธีใช้งาน:**
```bash
# เปิดไฟล์ใน browser (ต้องเริ่ม server ก่อน)
start examples/client-example.html

# หรือลากไฟล์เข้า browser โดยตรง
```

**ฟีเจอร์:**
- ✅ เชื่อมต่อ WebSocket โดยอัตโนมัติ
- ✅ UI ที่ใช้งานง่ายสำหรับทดสอบ
- ✅ จัดการ connections ผ่านปุ่มกด
- ✅ แสดง events แบบ real-time
- ✅ Monitor connections และสถิติ

## การใช้งาน

1. **เริ่ม TikTok Live Server:**
   ```bash
   cd ..
   node index.js
   ```

2. **เปิด HTML client:**
   ```bash
   start examples/client-example.html
   ```

3. **ทดสอบการใช้งาน:**
   - พิมพ์ username ที่ต้องการ
   - กดปุ่ม "Connect"
   - ดู events แบบ real-time

## กลับไปยังโปรเจคหลัก

```bash
cd ..
node index.js
```
