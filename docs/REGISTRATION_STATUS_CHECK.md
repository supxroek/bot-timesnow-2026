# การตรวจสอบสถานะการอนุมัติและการจัดการข้อผิดพลาด

## สรุปการปรับปรุง

เอกสารนี้อธิบายการปรับปรุงระบบการอนุมัติการลงทะเบียนสมาชิก ให้มีการตรวจสอบสถานะอัตโนมัติเมื่อเปิดลิงก์การอนุมัติ และจัดการข้อผิดพลาดเมื่อมีการอนุมัติซ้ำ

## ปัญหาเดิม

1. เมื่อ HR เปิดลิงก์อนุมัติ ระบบจะแสดงปุ่ม "อนุมัติ" และ "ปฏิเสธ" เสมอ แม้ว่าจะได้อนุมัติไปแล้ว
2. หากกดปุ่มอนุมัติซ้ำ จะได้รับข้อความ error จาก MySQL: `Duplicate entry '2154541212121-2' for key 'employees.idx_id_passport_company'`
3. HR ไม่ทราบว่าผู้ใช้รายนี้ได้รับการอนุมัติไปแล้วหรือไม่

## การแก้ไข

### 1. Backend Changes

#### 1.1 Model (`employee.model.js`)

เพิ่ม method ใหม่สำหรับตรวจสอบสถานะการลงทะเบียน:

```javascript
async checkRegistrationStatus(lineUserId, idCard, companyId) {
  const [rows] = await db.query(
    "SELECT id, name, lineUserId, ID_or_Passport_Number, start_date, created_at
     FROM employees
     WHERE (lineUserId = ? OR ID_or_Passport_Number = ?)
       AND companyId = ?
       AND (resign_date IS NULL OR resign_date > CURDATE())",
    [lineUserId, idCard, companyId]
  );
  return rows[0];
}
```

#### 1.2 Service (`register.service.js`)

**เพิ่ม `checkRegistrationStatusService`:**

- ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
- ค้นหาว่ามี record ในฐานข้อมูลหรือไม่ (ใช้ lineUserId หรือ IDCard)
- ส่งข้อมูลกลับว่าลงทะเบียนแล้วหรือยัง

```javascript
const checkRegistrationStatusService = async (token) => {
  const decoded = decodeApprovalToken(token);
  const { name, IDCard, companyId, lineUserId, start_date } = decoded;

  const registeredEmployee = await Employee.checkRegistrationStatus(
    lineUserId,
    IDCard,
    companyId
  );

  if (registeredEmployee) {
    return {
      isRegistered: true,
      message: "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว",
      userData: {
        name: registeredEmployee.name,
        IDCard: registeredEmployee.ID_or_Passport_Number,
        lineUserId: registeredEmployee.lineUserId,
        start_date: registeredEmployee.start_date,
        registered_at: registeredEmployee.created_at,
      },
    };
  }

  return {
    isRegistered: false,
    message: "คำขอลงทะเบียนยังไม่ได้รับการอนุมัติ",
    userData: { name, IDCard, companyId, lineUserId, start_date },
  };
};
```

**ปรับปรุง `processApproval` ให้จัดการ Duplicate Entry Error:**

```javascript
const processApproval = async (decoded) => {
  const { name, IDCard, companyId, lineUserId, start_date } = decoded;

  try {
    await Employee.create({
      name,
      IDCard,
      companyId,
      lineUserId,
      start_date,
    });
  } catch (error) {
    // จัดการ Duplicate Entry Error
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
      throw new AppError(
        "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว ไม่สามารถอนุมัติซ้ำได้",
        400
      );
    }
    throw error;
  }

  // Link Rich Menu และส่ง LINE notification...
};
```

#### 1.3 Controller (`liff.controller.js`)

เพิ่ม method ใหม่:

```javascript
checkRegistrationStatus = catchAsync(async (req, res, _next) => {
  const { token } = req.body;
  if (!token) {
    throw new AppError("ไม่พบ Token การยืนยันตัวตน", 400);
  }
  const result = await checkRegistrationStatusService(token);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
```

#### 1.4 Routes (`liff.routes.js`)

เพิ่ม endpoint ใหม่:

```javascript
.post(
  "/register/check-status",
  validate(authSchemas.checkStatus),
  liffController.checkRegistrationStatus
)
```

#### 1.5 Validation Middleware (`validate.middleware.js`)

เพิ่ม schema:

```javascript
checkStatus: Joi.object({
  token: Joi.string().required(),
});
```

### 2. Frontend Changes

#### 2.1 approve.js

**เพิ่มฟังก์ชันเรียก API:**

```javascript
async function callCheckStatusApi(token) {
  const baseUrl = getBaseUrl();
  return apiRequest({
    apiBaseUrl: baseUrl,
    path: "/liff/register/check-status",
    method: "POST",
    body: { token },
  });
}
```

**เพิ่มฟังก์ชันแสดงผลเมื่ออนุมัติแล้ว:**

```javascript
function showAlreadyApproved(userData) {
  // แสดงข้อความ "ผู้ใช้นี้ได้รับการอนุมัติไปแล้ว"
  // แสดงข้อมูลผู้ใช้และวันที่อนุมัติ
  // ซ่อนปุ่มอนุมัติ/ปฏิเสธ
}
```

**ปรับปรุง `init()` function:**

```javascript
async function init() {
  const token = getToken();

  // Validate token...

  showLoading();
  setText("main-title", "กำลังตรวจสอบสถานะ...");

  try {
    // เรียก API ตรวจสอบสถานะก่อน
    const statusResponse = await callCheckStatusApi(token);

    if (statusResponse.ok) {
      const { isRegistered, userData: responseUserData } = statusResponse.data;

      if (isRegistered) {
        // แสดงว่าอนุมัติแล้ว
        showAlreadyApproved(responseUserData);
      } else {
        // แสดงหน้าเลือก action
        showActionPage(userData);
        // เพิ่ม event listeners...
      }
    }
  } catch (error) {
    showError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
  }
}
```

## Flow ใหม่

### กรณีที่ยังไม่ได้อนุมัติ

1. HR เปิดลิงก์จากอีเมล
2. Frontend เรียก `/liff/register/check-status` ทันที
3. Backend ตรวจสอบฐานข้อมูล → ไม่พบ record
4. Frontend แสดงปุ่ม "อนุมัติ" และ "ปฏิเสธ"
5. HR กดปุ่ม → ทำการอนุมัติตามปกติ

### กรณีที่อนุมัติไปแล้ว

1. HR เปิดลิงก์จากอีเมล (อาจจะเปิดซ้ำ)
2. Frontend เรียก `/liff/register/check-status` ทันที
3. Backend ตรวจสอบฐานข้อมูล → พบ record แล้ว
4. Frontend แสดงข้อความ **"ผู้ใช้นี้ได้รับการอนุมัติไปแล้ว"**
5. ไม่แสดงปุ่มอนุมัติ/ปฏิเสธ
6. แสดงข้อมูลผู้ใช้และวันที่อนุมัติ

### กรณีที่มี Race Condition (กด approve พร้อมกันหลายครั้ง)

1. หาก frontend พลาดการตรวจสอบ และยิง approve API 2 ครั้งพร้อมกัน
2. การ insert ครั้งแรกสำเร็จ
3. การ insert ครั้งที่สอง → MySQL error `ER_DUP_ENTRY`
4. Backend catch error และ throw `AppError` ที่อ่านง่าย: **"ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว ไม่สามารถอนุมัติซ้ำได้"**
5. Frontend แสดงข้อความที่เป็นมิตร

## การทดสอบ

### Test Case 1: อนุมัติครั้งแรก

1. ลงทะเบียนสมาชิกใหม่
2. เปิดลิงก์จากอีเมล
3. ✅ ควรเห็นปุ่ม "อนุมัติ" และ "ปฏิเสธ"
4. กดปุ่ม "อนุมัติ"
5. ✅ ควรแสดง "ดำเนินการสำเร็จ"

### Test Case 2: เปิดลิงก์ซ้ำหลังอนุมัติแล้ว

1. ใช้ลิงก์เดิมที่อนุมัติไปแล้ว
2. เปิดลิงก์อีกครั้ง
3. ✅ ควรแสดง "ผู้ใช้นี้ได้รับการอนุมัติไปแล้ว"
4. ✅ ไม่ควรเห็นปุ่มอนุมัติ/ปฏิเสธ
5. ✅ ควรแสดงข้อมูลผู้ใช้และวันที่อนุมัติ

### Test Case 3: กดอนุมัติซ้ำ (Race Condition)

1. เปิด Developer Console
2. Run: `fetch('/liff/register/approve', {method:'POST', body: JSON.stringify({token: '...', action:'approve'}), headers:{'Content-Type':'application/json'}})` 2 ครั้งพร้อมกัน
3. ✅ ครั้งแรกสำเร็จ
4. ✅ ครั้งที่สองแสดงข้อความ "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว ไม่สามารถอนุมัติซ้ำได้"

### Test Case 4: Token หมดอายุ

1. รอจนกว่า token จะหมดอายุ (30 นาที)
2. เปิดลิงก์
3. ✅ ควรแสดง "ลิงก์นี้หมดอายุแล้ว กรุณาให้ผู้ใช้ทำการสมัครใหม่"

## API Endpoints

### POST /liff/register/check-status

ตรวจสอบสถานะการลงทะเบียน

**Request:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (ยังไม่ได้อนุมัติ):**

```json
{
  "status": "success",
  "data": {
    "isRegistered": false,
    "message": "คำขอลงทะเบียนยังไม่ได้รับการอนุมัติ",
    "userData": {
      "name": "สมชาย ใจดี",
      "IDCard": "1234567890123",
      "companyId": 2,
      "lineUserId": "U1234567890",
      "start_date": "2025-02-01"
    }
  }
}
```

**Response (อนุมัติแล้ว):**

```json
{
  "status": "success",
  "data": {
    "isRegistered": true,
    "message": "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว",
    "userData": {
      "name": "สมชาย ใจดี",
      "IDCard": "1234567890123",
      "lineUserId": "U1234567890",
      "start_date": "2025-02-01",
      "registered_at": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

## ไฟล์ที่แก้ไข

### Backend (bot-timesnow-2026)

- `src/modules/models/employee.model.js` - เพิ่ม checkRegistrationStatus(), findResignedEmployee(), reactivateEmployee()
- `src/modules/services/register.service.js` - เพิ่ม checkRegistrationStatusService(), ปรับ processApproval()
- `src/modules/api/liff.controller.js` - เพิ่ม checkRegistrationStatus()
- `src/modules/api/liff.routes.js` - เพิ่ม POST /register/check-status
- `src/shared/middlewares/validate.middleware.js` - เพิ่ม authSchemas.checkStatus

### Frontend (liff-timesnow-2026)

- `public/assets/js/pages/approve.js` - เพิ่ม callCheckStatusApi(), showAlreadyApproved(), ปรับ init()
- `public/pages/approve.html` - ปรับปรุง UX/UI ให้ responsive และ compact

## ประโยชน์

1. **UX ที่ดีขึ้น**: HR รู้ทันทีว่าอนุมัติไปแล้วหรือยัง ไม่ต้องเดาหรือกดปุ่มเพื่อดู error
2. **ป้องกัน Race Condition**: แม้จะกดอนุมัติซ้ำ ระบบจะบอกว่าอนุมัติแล้ว แทนที่จะแสดง error ที่อ่านยาก
3. **Performance**: ตรวจสอบสถานะก่อนแสดง UI ช่วยลด API calls ที่ไม่จำเป็น
4. **Audit Trail**: สามารถแสดงวันที่อนุมัติให้ HR เห็นได้
5. **Security**: ป้องกันการ abuse โดยการกด approve link หลายครั้ง

## Note

- Token มีอายุ 30 นาที ตามที่กำหนดใน `TOKEN_EXPIRY = "30m"`
- Database constraint `idx_id_passport_company` ป้องกันการลงทะเบียนซ้ำที่ database level
- Frontend check + Backend check = Double protection
