const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const readline = require("node:readline");

// Import Line Provider
const lineProvider = require("../src/shared/providers/line.provider");

// Import Flex Modules
const {
  greetingFlex,
} = require("../src/shared/templates/flex/modules/greeting.flex");
const {
  beaconDetectedFlex,
} = require("../src/shared/templates/flex/modules/beacon.flex");
const {
  beaconNotFoundFlex,
  noShiftFlex,
} = require("../src/shared/templates/flex/modules/error.flex");
const {
  attendanceSuccessMessage,
  attendanceStatusMessage,
} = require("../src/shared/templates/flex/modules/attendance.flex");
const {
  forgetRequestPendingMessage,
  forgetRequestApprovedMessage,
  forgetRequestRejectedMessage,
} = require("../src/shared/templates/flex/modules/forget-request.flex");
const {
  registerPendingMessage,
  registerApprovedMessage,
  registerRejectedMessage,
} = require("../src/shared/templates/flex/modules/register.flex");
const {
  createReportFlex,
} = require("../src/shared/templates/flex/modules/report.flex");

const TEST_USER_ID = "Ude06ec8f0654cdff6b31eeb0bd244b5b";

// =============================================================================
// MOCK DATA
// =============================================================================

const mockDate = new Date();
const dateStr = "2026-01-14";
const timeStr = "08:30";

const mockAttendance = {
  actionLabel: "เข้างาน",
  time: "08:30",
  date: mockDate,
  isDuplicate: false,
};

const mockAttendanceDuplicate = {
  ...mockAttendance,
  isDuplicate: true,
};

const mockStatusToday = {
  date: dateStr,
  timestamp: {
    start_time: "08:25:00",
    break_start_time: "12:00:00",
    break_end_time: null,
    end_time: null,
  },
  workingTime: {
    start_time: "08:30",
    break_start_time: "12:00",
    break_end_time: "13:00",
    end_time: "17:30",
  },
  isHeaderWarning: false,
};

const mockStatusTodayWarning = {
  ...mockStatusToday,
  isHeaderWarning: true,
};

const mockForgetRequest = {
  date: "14 ม.ค. 2026",
  time: "08:30",
  type: "work_in",
};

const mockForgetReject = {
  date: "14 ม.ค. 2026",
  type: "work_in",
  reason: "หลักฐานไม่เพียงพอ",
};

const mockRegister = {
  name: "สมชาย ใจดี",
  IDCard: "1103702589123",
  start_date: "2026-01-01",
};

const mockRegisterReject = {
  ...mockRegister,
  reason: "ข้อมูลบัตรประชาชนไม่ถูกต้อง",
};

const mockReport = {
  period: "มกราคม 2026",
  employeeName: "สมชาย ใจดี",
  stats: {
    totalLateCount: 3,
    totalLateMinutes: 45,
    totalLeaves: 2,
    totalAbsent: 1,
    totalWorkDays: 20,
    totalOTHours: 5.5,
    swapCount: 1,
    leaveDetails: {
      ลาป่วย: 1,
      ลากิจ: 1,
    },
  },
  dailyStatuses: [
    { date: "01/01", status: "วันหยุดนักขัตฤกษ์", isHoliday: true },
    { date: "02/01", status: "มาทำงาน", isHoliday: false },
    { date: "03/01", status: "มาทำงาน (สาย 15น.)", isHoliday: false },
    { date: "04/01", status: "หยุด", isHoliday: true },
    { date: "05/01", status: "หยุด", isHoliday: true },
    { date: "06/01", status: "ลาป่วย", isHoliday: false },
    { date: "07/01", status: "ขาดงาน", isHoliday: false },
    { date: "08/01", status: "-", isHoliday: false },
  ],
};

// =============================================================================
// TEST CASES
// =============================================================================

const testCases = [
  {
    name: "Greeting (สวัสดี)",
    gen: () => greetingFlex(),
  },
  {
    name: "Beacon Detected (เจอจุดลงเวลา)",
    gen: () => beaconDetectedFlex("Gate-A", "เข้างาน", "08:30"),
  },
  {
    name: "Beacon Not Found (ไม่เจอสัญญาณ)",
    gen: () => beaconNotFoundFlex(),
  },
  {
    name: "No Shift (ไม่พบกะงาน)",
    gen: () => noShiftFlex(),
  },
  {
    name: "Attendance Success (ลงเวลาสำเร็จ)",
    gen: () => attendanceSuccessMessage(mockAttendance),
  },
  {
    name: "Attendance Duplicate (ลงเวลาซ้ำ)",
    gen: () => attendanceSuccessMessage(mockAttendanceDuplicate),
  },
  {
    name: "Status Today (สถานะเวลาทำงาน)",
    gen: () => attendanceStatusMessage(mockStatusToday),
  },
  {
    name: "Status Today Warning (เตือนสถานะ)",
    gen: () => attendanceStatusMessage(mockStatusTodayWarning),
  },
  {
    name: "Forget Request Pending (แจ้งลืม: รออนุมัติ)",
    gen: () => forgetRequestPendingMessage(mockForgetRequest),
  },
  {
    name: "Forget Request Approved (แจ้งลืม: อนุมัติ)",
    gen: () => forgetRequestApprovedMessage(mockForgetRequest),
  },
  {
    name: "Forget Request Rejected (แจ้งลืม: ปฏิเสธ)",
    gen: () => forgetRequestRejectedMessage(mockForgetReject),
  },
  {
    name: "Register Pending (สมัคร: รออนุมัติ)",
    gen: () => registerPendingMessage(mockRegister),
  },
  {
    name: "Register Approved (สมัคร: อนุมัติ)",
    gen: () => registerApprovedMessage(mockRegister),
  },
  {
    name: "Register Rejected (สมัคร: ปฏิเสธ)",
    gen: () => registerRejectedMessage(mockRegisterReject),
  },
  {
    name: "Daily Report (สรุปรายเดือน)",
    gen: () => createReportFlex(mockReport),
  },
];

// =============================================================================
// MAIN UI INTERFACE
// =============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.clear();
console.log("\n🧪 --- TIME NOW 2026 FLEX MESSAGE TESTER --- 🧪\n");
console.log(`Target User ID: ${TEST_USER_ID}\n`);

testCases.forEach((tc, index) => {
  console.log(`${index + 1}. ${tc.name}`);
});
console.log("0. Exit");

const promptUser = () => {
  rl.question("\n👉 Select a test case number: ", async (answer) => {
    const choice = Number.parseInt(answer);

    if (choice === 0) {
      console.log("Goodbye! 👋");
      rl.close();
      process.exit(0);
    }

    if (choice > 0 && choice <= testCases.length) {
      const selected = testCases[choice - 1];
      console.log(`\n📤 Sending: ${selected.name}...`);

      try {
        const flexMessage = selected.gen();

        await lineProvider.push(TEST_USER_ID, flexMessage);
        console.log("✅ Send Success!");
      } catch (error) {
        console.error("❌ Send Failed:", error.message);
        if (error.response) {
          console.error("Details:", JSON.stringify(error.response.data));
        }
      }
    } else {
      console.log("Invalid selection, please try again.");
    }

    promptUser(); // Loop
  });
};

promptUser();
