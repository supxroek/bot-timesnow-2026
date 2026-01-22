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
  targetTime: "08:30", // คือเวลาเป้าหมาย (ถ้ามี)
};

const mockAttendanceLate = {
  ...mockAttendance,
  time: "09:15",
};

const mockAttendanceDuplicate = {
  ...mockAttendance,
  isDuplicate: true,
};

const mockStatusToday = {
  date: dateStr,
  timestamp: {
    start_time: "08:35:00",
    break_start_time: "12:00:00",
    break_end_time: "13:05:00",
    end_time: null,
    ot_start_time: null,
    ot_end_time: "19:30:00",
  },
  workingTime: {
    start_time: "08:30",
    break_start_time: "12:00",
    break_end_time: "13:00",
    end_time: "17:30",
  },
  isHeaderWarning: false,
};

const mockStatusOT = {
  ...mockStatusToday,
  workingTime: {
    start_time: "08:30",
    break_start_time: "12:00",
    break_end_time: "13:00",
    end_time: "17:30",
    ot_start_time: "17:30",
    ot_end_time: "19:30",
  },
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
  time: "08:30",
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

// รายงานสรุปรายเดือน (ทั้งหมด)
const mockReport = {
  period: "มกราคม 2026",
  company: {
    id: 101,
    name: "บริษัท ตัวอย่าง จำกัด",
    report_date: 1,
    leaveHubConnected: false, // เชื่อมต่อกับ LeaveHub
  },
  employee: {
    id: 501,
    employee_code: "EMP-0501",
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    branch_id: 11,
    department_id: 21,
    start_date: "2024-07-01",
    status: "active",
  },
  stats: {
    employee_id: 501, // ID พนักงาน
    company_id: 101, // ID บริษัท
    totalLateCount: 7, // จำนวนครั้งที่มาสาย
    totalLateMinutes: 54, // จำนวนเวลาที่มาสาย (นาที)
    totalWorkHours: 152, // จำนวนชั่วโมงทำงาน
    totalLeaves: 4, // จำนวนวันลางาน
    totalAbsent: 1, // จำนวนวันขาดงาน
    totalWorkDays: 16, // จำนวนวันที่ทำงานจริง
    totalWeekdayOTHours: 8, // จำนวนชั่วโมงโอทีวันธรรมดา
    totalHolidayOTHours: 4, // จำนวนชั่วโมงโอทีวันหยุด
    swapCount: 2, // จำนวนวันหยุดชดเชย
    leaveDetails: {
      ลาป่วย: 2,
      ลากิจ: 1,
      ลาพักร้อน: 1,
    },
  },
  dailyStatuses: [
    {
      date: "01", // วันที่
      dayOfWeek: "จ.", // วันในสัปดาห์
      holidayName: "วันขึ้นปีใหม่", // ชื่อวันหยุด (ถ้ามี)
      checkInTime: null, // เวลาเข้างาน
      checkOutTime: null, // เวลาออกงาน
      checkInStatus: null, // สถานะเข้า: normal, late, absent
      checkOutStatus: null, // สถานะออก: normal, early_exit, absent
      leaveType: null, // ประเภทการลา
      isPublicHoliday: true, // วันหยุดนักขัตฤกษ์
      isCompensatory: false, // วันหยุดชดเชย
      isShiftSwap: false, // สลับวันหยุด
      isDayOff: false, // วันหยุดประจำสัปดาห์
    },
    {
      date: "02",
      dayOfWeek: "อ.",
      holidayName: null,
      checkInTime: "08:27",
      checkOutTime: "20:38",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "03",
      dayOfWeek: "พ.",
      holidayName: null,
      checkInTime: "08:24",
      checkOutTime: "18:34",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "04",
      dayOfWeek: "พฤ.",
      holidayName: null,
      checkInTime: "09:02",
      checkOutTime: "18:44",
      checkInStatus: "late", // มาสาย
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "05",
      dayOfWeek: "ศ.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: "พักร้อน", // ลาพักร้อน
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "06",
      dayOfWeek: "ส.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true, // วันหยุดประจำสัปดาห์
    },
    {
      date: "07",
      dayOfWeek: "อา.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true, // วันหยุดประจำสัปดาห์
    },
    {
      date: "08",
      dayOfWeek: "จ.",
      holidayName: "ชดเชยวันจักรี",
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: true, // วันหยุดชดเชย
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "09",
      dayOfWeek: "อ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "17:30",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "10",
      dayOfWeek: "พ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "16:00",
      checkInStatus: "normal",
      checkOutStatus: "early_exit", // ออกก่อนเวลา
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "11",
      dayOfWeek: "พฤ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "17:30",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "12",
      dayOfWeek: "ศ.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: "absent", // ขาดงาน
      checkOutStatus: "absent",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "13",
      dayOfWeek: "ส.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: true, // สลับวันหยุด
      isDayOff: false,
    },
    {
      date: "14",
      dayOfWeek: "อา.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true, // วันหยุดประจำสัปดาห์
    },
    {
      date: "15",
      dayOfWeek: "จ.",
      holidayName: null,
      checkInTime: "08:29",
      checkOutTime: "17:31",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "16",
      dayOfWeek: "อ.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: "17:29",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "17",
      dayOfWeek: "พ.",
      holidayName: null,
      checkInTime: "08:45",
      checkOutTime: "17:15",
      checkInStatus: "late",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "18",
      dayOfWeek: "พฤ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: null,
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "19",
      dayOfWeek: "ศ.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: "ลากิจ",
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "20",
      dayOfWeek: "ส.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true,
    },
    {
      date: "21",
      dayOfWeek: "อา.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true,
    },
    {
      date: "22",
      dayOfWeek: "จ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "17:30",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "23",
      dayOfWeek: "อ.",
      holidayName: null,
      checkInTime: "08:35",
      checkOutTime: "17:25",
      checkInStatus: "late",
      checkOutStatus: "early_exit",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "24",
      dayOfWeek: "พ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "17:30",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "25",
      dayOfWeek: "พฤ.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: "ลาป่วย",
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "26",
      dayOfWeek: "ศ.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: "ลาป่วย",
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "27",
      dayOfWeek: "ส.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true,
    },
    {
      date: "28",
      dayOfWeek: "อา.",
      holidayName: null,
      checkInTime: null,
      checkOutTime: null,
      checkInStatus: null,
      checkOutStatus: null,
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: true,
    },
    {
      date: "29",
      dayOfWeek: "จ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "17:30",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "30",
      dayOfWeek: "อ.",
      holidayName: null,
      checkInTime: "08:32",
      checkOutTime: "17:28",
      checkInStatus: "late",
      checkOutStatus: "early_exit",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
    {
      date: "31",
      dayOfWeek: "พ.",
      holidayName: null,
      checkInTime: "08:30",
      checkOutTime: "17:30",
      checkInStatus: "normal",
      checkOutStatus: "normal",
      leaveType: null,
      isPublicHoliday: false,
      isCompensatory: false,
      isShiftSwap: false,
      isDayOff: false,
    },
  ],
};

// ไม่ขาดงาน/สายเลย
const mockReportNoIssues = {
  ...mockReport,
  stats: {
    ...mockReport.stats,
    totalLateCount: 0,
    totalLateMinutes: 0,
    totalAbsent: 0,
  },
};

// เชื่อมต่อกับ LeaveHub
const mockReportWithLeaveHub = {
  ...mockReport,
  company: {
    ...mockReport.company,
    leaveHubConnected: true,
  },
};

// ไม่มีการลางานเลย
const mockReportNoLeaves = {
  ...mockReport,
  company: {
    ...mockReport.company,
    leaveHubConnected: true,
  },
  stats: {
    ...mockReport.stats,
    totalLeaves: 0,
    leaveDetails: {},
  },
};

// ไม่มีการลางาน/วันหยุดชดเชยเลย
const mockReportNoLeavesNoSwap = {
  ...mockReport,
  company: {
    ...mockReport.company,
    leaveHubConnected: true,
  },
  stats: {
    ...mockReport.stats,
    totalLeaves: 0,
    swapCount: 0,
    leaveDetails: {},
  },
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
    gen: () =>
      attendanceSuccessMessage(
        mockAttendance.actionLabel,
        mockAttendance.time,
        mockAttendance.date,
        mockAttendance.isDuplicate,
        mockAttendance.targetTime,
      ),
  },
  {
    name: "Attendance Late (ลงเวลาสาย)",
    gen: () =>
      attendanceSuccessMessage(
        mockAttendanceLate.actionLabel,
        mockAttendanceLate.time,
        mockAttendanceLate.date,
        mockAttendanceLate.isDuplicate,
        mockAttendanceLate.targetTime,
      ),
  },
  {
    name: "Attendance Duplicate (ลงเวลาซ้ำ)",
    gen: () =>
      attendanceSuccessMessage(
        mockAttendanceDuplicate.actionLabel,
        mockAttendanceDuplicate.time,
        mockAttendanceDuplicate.date,
        mockAttendanceDuplicate.isDuplicate,
        mockAttendanceDuplicate.targetTime,
      ),
  },
  {
    name: "Status Today (สถานะเวลาทำงาน)",
    gen: () =>
      attendanceStatusMessage(
        mockStatusToday.timestamp,
        mockStatusToday.workingTime,
        mockStatusToday.date,
        mockStatusToday.isHeaderWarning,
      ),
  },
  {
    name: "Status Today OT (สถานะเวลาทำงาน + OT)",
    gen: () =>
      attendanceStatusMessage(
        mockStatusOT.timestamp,
        mockStatusOT.workingTime,
        mockStatusOT.date,
        mockStatusOT.isHeaderWarning,
      ),
  },
  {
    name: "Status Today Warning (เตือนสถานะ)",
    gen: () =>
      attendanceStatusMessage(
        mockStatusTodayWarning.timestamp,
        mockStatusTodayWarning.workingTime,
        mockStatusTodayWarning.date,
        mockStatusTodayWarning.isHeaderWarning,
      ),
  },
  {
    name: "Forget Request Pending (แจ้งลืม: รออนุมัติ)",
    gen: () =>
      forgetRequestPendingMessage(
        mockForgetRequest.date,
        mockForgetRequest.time,
        mockForgetRequest.type,
      ),
  },
  {
    name: "Forget Request Approved (แจ้งลืม: อนุมัติ)",
    gen: () =>
      forgetRequestApprovedMessage(
        mockForgetRequest.date,
        mockForgetRequest.time,
        mockForgetRequest.type,
      ),
  },
  {
    name: "Forget Request Rejected (แจ้งลืม: ปฏิเสธ)",
    gen: () =>
      forgetRequestRejectedMessage(
        mockForgetReject.date,
        mockForgetReject.time,
        mockForgetReject.type,
        mockForgetReject.reason,
      ),
  },
  {
    name: "Register Pending (สมัคร: รออนุมัติ)",
    gen: () =>
      registerPendingMessage(
        mockRegister.name,
        mockRegister.IDCard,
        mockRegister.start_date,
      ),
  },
  {
    name: "Register Approved (สมัคร: อนุมัติ)",
    gen: () =>
      registerApprovedMessage(
        mockRegister.name,
        mockRegister.IDCard,
        mockRegister.start_date,
      ),
  },
  {
    name: "Register Rejected (สมัคร: ปฏิเสธ)",
    gen: () =>
      registerRejectedMessage(
        mockRegisterReject.name,
        mockRegisterReject.IDCard,
        mockRegisterReject.start_date,
        mockRegisterReject.reason,
      ),
  },
  {
    name: "Daily Report (สรุปรายเดือน)",
    gen: () =>
      createReportFlex(
        mockReport.period,
        mockReport.company.leaveHubConnected,
        mockReport.employee.name,
        mockReport.stats,
        mockReport.dailyStatuses,
      ),
  },
  {
    name: "Daily Report No Issues (สรุปรายเดือน ไม่มีการสาย/ขาดงาน)",
    gen: () =>
      createReportFlex(
        mockReportNoIssues.period,
        mockReportNoIssues.company.leaveHubConnected,
        mockReportNoIssues.employee.name,
        mockReportNoIssues.stats,
        mockReportNoIssues.dailyStatuses,
      ),
  },
  {
    name: "Daily Report With LeaveHub (สรุปรายเดือน เชื่อม LeaveHub)",
    gen: () =>
      createReportFlex(
        mockReportWithLeaveHub.period,
        mockReportWithLeaveHub.company.leaveHubConnected,
        mockReportWithLeaveHub.employee.name,
        mockReportWithLeaveHub.stats,
        mockReportWithLeaveHub.dailyStatuses,
      ),
  },
  {
    name: "Daily Report No Leaves (สรุปรายเดือน ไม่มีการลางาน)",
    gen: () =>
      createReportFlex(
        mockReportNoLeaves.period,
        mockReportNoLeaves.company.leaveHubConnected,
        mockReportNoLeaves.employee.name,
        mockReportNoLeaves.stats,
        mockReportNoLeaves.dailyStatuses,
      ),
  },
  {
    name: "Daily Report No Leaves No Swap (สรุปรายเดือน ไม่มีการลางาน/วันหยุดชดเชย)",
    gen: () =>
      createReportFlex(
        mockReportNoLeavesNoSwap.period,
        mockReportNoLeavesNoSwap.company.leaveHubConnected,
        mockReportNoLeavesNoSwap.employee.name,
        mockReportNoLeavesNoSwap.stats,
        mockReportNoLeavesNoSwap.dailyStatuses,
      ),
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

async function test(event) {
  const { replyToken } = event;

  try {
    /**
     * 0. Greeting (สวัสดี)
     * 1. Beacon Detected (เจอจุดลงเวลา)
     * 2. Beacon Not Found (ไม่เจอสัญญาณ)
     * 3. No Shift (ไม่พบกะงาน)
     * 4. Attendance Success (ลงเวลาสำเร็จ)
     * 5. Attendance Late (ลงเวลาสาย)
     * 6. Attendance Duplicate (ลงเวลาซ้ำ)
     * 7. Status Today (สถานะเวลาทำงาน)
     * 8. Status Today OT (สถานะเวลาทำงาน + OT)
     * 9. Status Today Warning (เตือนสถานะ)
     * 10. Forget Request Pending (แจ้งลืม: รออนุมัติ)
     * 11. Forget Request Approved (แจ้งลืม: อนุมัติ)
     * 12. Forget Request Rejected (แจ้งลืม: ปฏิเสธ)
     * 13. Register Pending (สมัคร: รออนุมัติ)
     * 14. Register Approved (สมัคร: อนุมัติ)
     * 15. Register Rejected (สมัคร: ปฏิเสธ)
     * 16. Daily Report (สรุปรายเดือน)
     * 17. Daily Report No Issues (สรุปรายเดือน ไม่มีการสาย/ขาดงาน)
     * 18. Daily Report With LeaveHub (สรุปรายเดือน เชื่อม LeaveHub)
     * 19. Daily Report No Leaves (สรุปรายเดือน ไม่มีการลางาน)
     * 20. Daily Report No Leaves No Swap (สรุปรายเดือน ไม่มีการลางาน/วันหยุดชดเชย)
     */
    const messages = testCases[17].gen();

    await lineProvider.reply(replyToken, messages);

    console.log(JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error("Error in test function:", error.message);
  }
}

module.exports = test;

promptUser();
