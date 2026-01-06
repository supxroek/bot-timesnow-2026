# Registration Approval Flow Diagram

## Before Improvement

User registers → Email to HR → HR clicks link
↓
Always shows 2 buttons
(approve/reject)
↓
HR clicks "Approve"
↓
If already approved:
❌ MySQL Error: Duplicate entry

## After Improvement

User registers → Email to HR → HR clicks link
↓
Check status API call
↓
┌──────────────────────────────┐
│ │
Not Approved Yet Already Approved
│ │
↓ ↓
Show 2 buttons Show "Already Approved" message
(approve/reject) with user details + date
│ │
HR clicks "Approve" No action needed
│
↓
Insert to database
│
┌─────┴─────┐
│ │
Success Duplicate Entry
│ (Race Condition)
↓ ↓
Show success ✅ Friendly error:
message "Already approved"

## Technical Flow

### Frontend (approve.html + approve.js)

Page Load (init)
↓
Get token from URL
↓
Decode & validate token
↓
Show loading...
↓
Call API: POST /liff/register/check-status
↓
Response: { isRegistered: true/false }
↓
┌───────────────────────────────────┐
│ │
isRegistered = false isRegistered = true
│ │
showActionPage() showAlreadyApproved()

- Show user info - Show "Already approved" message
- Show 2 buttons - Show user info + registered_at
- Add click handlers - No buttons - Auto-close in 3 seconds

### Backend API Flow

#### Endpoint: POST /liff/register/check-status

Receive request { token }
↓
Validate token (Joi schema)
↓
liffController.checkRegistrationStatus()
↓
checkRegistrationStatusService(token)
↓
decodeApprovalToken(token) → JWT verify
↓
Employee.checkRegistrationStatus(lineUserId, IDCard, companyId)
↓
Query database:
SELECT \* FROM employees
WHERE (lineUserId = ? OR ID_or_Passport_Number = ?)
AND companyId = ?
AND (resign_date IS NULL OR resign_date > CURDATE())
↓
┌───────────────────────────────────┐
│ │
Record found Record not found
│ │
Return: Return:
{ {
isRegistered: true, isRegistered: false,
message: "อนุมัติแล้ว", message: "ยังไม่ได้อนุมัติ",
userData: { userData: {
name, name,
IDCard, IDCard,
lineUserId, companyId,
start_date, lineUserId,
registered_at start_date
} }
} }

#### Endpoint: POST /liff/register/approve (Improved)

Receive request { token, action, reason }
↓
Validate token & action (Joi schema)
↓
liffController.approveRegistration()
↓
approveService({ token, action, reason })
↓
decodeApprovalToken(token) → JWT verify
↓
validateApprovalData(decoded)
↓
action = "approve"?
↓
YES → processApproval(decoded, existingEmployee)
↓
try {
if (existingEmployee with resign_date) {
Employee.reactivateEmployee() // อัพเดทและ reset resign_date = NULL
} else {
Employee.create() // สร้างใหม่
}
}
↓
┌───────────────────────────────────────┐
│ │
Success MySQL Error
│ (ER_DUP_ENTRY)
↓ ↓
Link Rich Menu catch and throw AppError:
Send LINE notification "ผู้ใช้นี้ได้รับการอนุมัติแล้ว
Return success ไม่สามารถอนุมัติซ้ำได้"
↓
Frontend shows friendly error

## Database Schema Context

### employees Table (Key Columns)

┌──────────────────────────────────────────────────────────┐
│ Column Name │ Type │ Note │
├───────────────────────────┼─────────────┼────────────────┤
│ id │ INT │ PK │
│ name │ VARCHAR │ │
│ ID_or_Passport_Number │ VARCHAR(13) │ │
│ companyId │ INT │ │
│ lineUserId │ VARCHAR │ │
│ start_date │ DATE │ │
│ resign_date │ DATE │ NULL = active │
│ created_at │ TIMESTAMP │ Registration │
│ │ │ timestamp │
├───────────────────────────┴─────────────┴────────────────┤
│ UNIQUE KEY: idx_id_passport_company │
│ (ID_or_Passport_Number, companyId) │
│ │
│ This constraint prevents duplicate registrations! │
└──────────────────────────────────────────────────────────┘

Note: NO "status" or "approved_at" columns!
Approval is determined by record existence.

## Error Handling Comparison

### Old Behavior

HR clicks approve (already approved):
→ MySQL Error:
"Duplicate entry '1234567890123-2' for key 'employees.idx_id_passport_company'"
→ Frontend shows raw error ❌
→ HR confused 😕

### New Behavior - Prevention

HR opens link (already approved):
→ Frontend checks status first ✅
→ Shows "Already approved" message 🎉
→ Buttons hidden 👍
→ No error occurs! 😊

### New Behavior - Backup (Race Condition)

HR clicks approve twice simultaneously:
→ First request: Success ✅
→ Second request: Duplicate entry
→ Backend catches ER_DUP_ENTRY
→ Throws AppError: "ผู้ใช้นี้ได้รับการอนุมัติแล้ว ไม่สามารถอนุมัติซ้ำได้"
→ Frontend shows friendly error ✅
→ HR understands the situation 😊

## Token Lifecycle

User registers
↓
Generate JWT token (exp: 30 minutes)
↓
Send email with link containing token
↓
┌─────────────────────────────────────────┐
│ │
│ HR opens link within 30 min │
│ ↓ │
│ Token valid ✅ │
│ ↓ │
│ Check status & show UI │
│ │
└─────────────────────────────────────────┘
│
│ HR opens link after 30 min
↓
Token expired ❌
↓
Show: "ลิงก์นี้หมดอายุแล้ว
กรุณาให้ผู้ใช้ทำการสมัครใหม่"

## Security Layers

Layer 1: Token Expiry (30 minutes)
↓
Layer 2: JWT Signature Verification
↓
Layer 3: Company Validation (companyId exists)
↓
Layer 4: Status Check (prevent duplicate clicks)
↓
Layer 5: Database Constraint (idx_id_passport_company)
↓
Layer 6: Error Handling (catch ER_DUP_ENTRY)

## Component Interaction

┌─────────────────────────────────────────────────────────┐
│ Frontend │
│ approve.html + approve.js │
│ - UI rendering │
│ - Token decoding │
│ - API calls │
└──────────────────┬──────────────────────────────────────┘
│ HTTP POST
│ /liff/register/check-status
│ /liff/register/approve
↓
┌─────────────────────────────────────────────────────────┐
│ API Layer │
│ liff.routes.js → liff.controller.js │
│ - Request validation (Joi) │
│ - Route handling │
└──────────────────┬──────────────────────────────────────┘
│
↓
┌─────────────────────────────────────────────────────────┐
│ Business Logic │
│ register.service.js │
│ - checkRegistrationStatusService() │
│ - approveService() │
│ - processApproval() │
│ - JWT decode & validation │
│ - Handle reactivation for resigned employees │
└──────────────────┬──────────────────────────────────────┘
│
↓
┌─────────────────────────────────────────────────────────┐
│ Data Layer │
│ employee.model.js → MySQL │
│ - checkRegistrationStatus() │
│ - findResignedEmployee() │
│ - reactivateEmployee() │
│ - create() │
│ - isAlreadyRegistered() │
└─────────────────────────────────────────────────────────┘

## Summary of Changes

### Files Modified

1. **Backend Models** (1 file)

   - `employee.model.js` → Added checkRegistrationStatus(), findResignedEmployee(), reactivateEmployee()

2. **Backend Services** (1 file)

   - `register.service.js` → Added checkRegistrationStatusService(), improved error handling, support reactivation

3. **Backend Controllers** (1 file)

   - `liff.controller.js` → Added checkRegistrationStatus endpoint

4. **Backend Routes** (1 file)

   - `liff.routes.js` → Added POST /register/check-status

5. **Backend Middleware** (1 file)

   - `validate.middleware.js` → Added checkStatus schema

6. **Frontend JavaScript** (1 file)

   - `approve.js` → Added status check on page load, improved UI with auto-close

7. **Frontend HTML** (1 file)
   - `approve.html` → Improved UX/UI with responsive and compact design

### 1 New Endpoint

- `POST /liff/register/check-status` → Returns registration status

### Key Features Added

1. **Status Check** - Check if user already approved before showing buttons
2. **Duplicate Prevention** - Friendly error message for duplicate approvals
3. **Resigned Employee Reactivation** - Support re-registration for resigned employees
4. **Auto-close Countdown** - Page closes automatically after 3 seconds when already approved
5. **Responsive & Compact Design** - Mobile-first approach with reduced padding/margins

### 2 Documentation Files

- `REGISTRATION_STATUS_CHECK.md` → Complete technical documentation
- `REGISTRATION_FLOW_DIAGRAM.md` → Visual flow diagrams (this file)

## ประโยชน์

1. **UX ที่ดีขึ้น**: HR รู้ทันทีว่าอนุมัติไปแล้วหรือยัง ไม่ต้องเดาหรือกดปุ่มเพื่อดู error
2. **ป้องกัน Race Condition**: แม้จะกดอนุมัติซ้ำ ระบบจะบอกว่าอนุมัติแล้ว แทนที่จะแสดง error ที่อ่านยาก
3. **Resigned Employee Reactivation**: พนักงานที่ลาออกสามารถสมัครใหม่ได้โดยอัพเดทข้อมูลเดิม
4. **Performance**: ตรวจสอบสถานะก่อนแสดง UI ช่วยลด API calls ที่ไม่จำเป็น
5. **Audit Trail**: สามารถแสดงวันที่อนุมัติให้ HR เห็นได้
6. **Security**: ป้องกันการ abuse โดยการกด approve link หลายครั้ง

- `REGISTRATION_STATUS_CHECK.md` → Complete technical documentation
- `REGISTRATION_FLOW_DIAGRAM.md` → Visual flow diagrams (this file)
