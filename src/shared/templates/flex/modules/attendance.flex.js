const dayjs = require("dayjs");
const { buildBubble } = require("../layouts/base-layout");
const atoms = require("../components/base-ui");

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Helper สร้างกล่องเวลาอัจฉริยะ (Smart Time Box)
 */
const _smartTimeBox = (
  label,
  timeVal,
  targetTimeVal, // From workingTime
  dateStr,
  type,
  now = dayjs()
) => {
  // สร้าง content หลัก
  let contentComponent;

  if (timeVal) {
    // 1. กรณีมีเวลาลงบันทึกแล้ว
    const formattedTime =
      timeVal.length > 5 ? timeVal.substring(0, 5) : timeVal;

    // Determine color based on lateness when targetTimeVal is available
    let timeColor = "#333333";
    try {
      if (targetTimeVal) {
        const normalizedDate = dayjs(dateStr).format("YYYY-MM-DD");
        const recorded = dayjs(`${normalizedDate} ${timeVal}`);
        const target = dayjs(`${normalizedDate} ${targetTimeVal}`);
        const isLateRecorded = recorded.diff(target, "minute") > 0;
        timeColor = isLateRecorded ? "#E65100" : "#00B900";
      }
    } catch (error) {
      console.error("Error determining time color:", error);
      timeColor = "#333333";
    }

    contentComponent = {
      type: "text",
      text: formattedTime,
      size: "xl",
      weight: "bold",
      color: timeColor,
      align: "center",
      margin: "xs",
    };
  } else if (targetTimeVal) {
    // 2. กรณีไม่มีเวลา แต่มี Target Time (Context-Aware)
    const targetDateTime = dayjs(`${dateStr} ${targetTimeVal}`);
    // Buffer Check > 30 mins
    const isLate = now.diff(targetDateTime, "minute") > 30;

    if (isLate) {
      // 2.1 เลยเวลาแล้ว -> แสดงปุ่มแจ้งลืม
      contentComponent = {
        type: "box",
        layout: "vertical",
        justifyContent: "center",
        alignItems: "center",
        contents: [
          {
            type: "box",
            layout: "baseline",
            width: "60%",
            justifyContent: "center",
            contents: [
              {
                type: "text",
                text: "แจ้งลืม",
                size: "sm",
                color: "#ffffff",
                weight: "bold",
                align: "center",
              },
            ],
            action: {
              type: "uri",
              label: "แจ้งลืม",
              uri: `https://liff.line.me/2006755947-3C7TBS5B?date=${dateStr}&type=${type}`,
            },
            backgroundColor: "#FF3333",
            cornerRadius: "md",
            paddingAll: "4px",
            margin: "xs",
          },
        ],
        margin: "xs",
      };
    } else {
      // 2.2 ยังไม่ถึงเวลาหรือยังอยู่ในช่วง Buffer -> แสดง -
      contentComponent = {
        type: "text",
        text: "-",
        size: "xl",
        weight: "regular",
        color: "#cccccc",
        align: "center",
        margin: "xs",
      };
    }
  } else {
    // 3. กรณีไม่มี Target Time -> แสดง -
    contentComponent = {
      type: "text",
      text: "-",
      size: "xl",
      weight: "regular",
      color: "#cccccc",
      align: "center",
      margin: "xs",
    };
  }

  return {
    type: "box",
    layout: "vertical",
    width: "50%",
    contents: [
      {
        type: "text",
        text: label,
        size: "xs",
        color: "#888888",
        align: "center",
      },
      contentComponent,
    ],
  };
};

// =============================================================================
// 1. Flex: แจ้งเตือนเมื่อบันทึกเวลาสำเร็จ (และกรณีซ้ำ)
// =============================================================================

// Helper function to compute late minutes
const computeLateMinutes = (time, targetTime, date) => {
  let lateMinutes = null;
  try {
    if (time && targetTime) {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const recorded = dayjs(`${dateStr} ${time}`);
      const target = dayjs(`${dateStr} ${targetTime}`);
      const diff = recorded.diff(target, "minute");
      if (diff > 0) lateMinutes = diff;
    }
  } catch (error) {
    console.error("Error computing late minutes:", error);
    lateMinutes = null;
  }
  return lateMinutes;
};

// Helper function to determine status
const getStatus = (isDuplicate, lateMinutes, time, targetTime) => {
  if (isDuplicate) {
    return "duplicate";
  } else if (lateMinutes) {
    return "late";
  } else if (time && targetTime) {
    return "ontime";
  } else {
    return "unknown";
  }
};

// Flex Message: Attendance Success or Duplicate
function attendanceSuccessMessage(
  label,
  time,
  date,
  isDuplicate = false,
  targetTime = null
) {
  // Compute late minutes
  const lateMinutes = computeLateMinutes(time, targetTime, date);

  // Determine status
  const status = getStatus(isDuplicate, lateMinutes, time, targetTime);

  // Configuration object for status properties
  const statusConfig = {
    duplicate: {
      headerColor: "#E65100",
      titleText: "⚠️ คุณลงเวลาไปแล้ว",
      timeColor: "#666666",
      subTitleText: `ระบบพบข้อมูล ${label} ในช่วงเวลานี้แล้ว`,
      badge: {
        text: "⚠️ ลงเวลาแล้ว",
        color: "#E65100",
      },
    },
    late: {
      headerColor: "#E65100",
      titleText: "บันทึกเวลาสำเร็จ",
      timeColor: "#E65100",
      subTitleText: `บันทึกข้อมูล ${label} (สาย)`,
      badge: {
        text: `⏱️ สาย ${lateMinutes} นาที`,
        color: "#E65100",
      },
    },
    ontime: {
      headerColor: "#1B5E20",
      titleText: "บันทึกเวลาสำเร็จ",
      timeColor: "#00B900",
      subTitleText: `บันทึกข้อมูล ${label} เรียบร้อยแล้ว`,
      badge: {
        text: "✅ ตรงเวลา",
        color: "#00B900",
      },
    },
    unknown: {
      headerColor: "#1B5E20",
      titleText: "บันทึกเวลาสำเร็จ",
      timeColor: "#00B900",
      subTitleText: `บันทึกข้อมูล ${label}`,
      badge: null,
    },
  };

  const config = statusConfig[status];

  // Helper function to create status badge
  const createStatusBadge = (badge) => {
    if (!badge) return null;
    return {
      type: "box",
      layout: "baseline",
      contents: [
        {
          type: "text",
          text: badge.text,
          size: "xs",
          color: badge.color,
          weight: "bold",
          align: "center",
          flex: 1,
        },
      ],
      margin: "md",
      spacing: "sm",
    };
  };

  const statusBadge = createStatusBadge(config.badge);

  let formattedTime = "--:--";
  if (time) {
    formattedTime = time.length > 5 ? time.substring(0, 5) : time;
  }
  return atoms.makeFlex("บันทึกเวลา", {
    ...buildBubble({
      title: { text: config.titleText, color: config.headerColor },
      subTitle: { text: config.subTitleText, color: "#666666" },
      contents: [
        atoms.boxColumns({
          margin: "lg",
          spacing: "md",
          contents: [
            atoms.infoRow("วันที่", dayjs(date).format("D MMM YYYY")),
            atoms.infoRow("รายการ", label, true),
          ],
        }),
        atoms.boxColumns({
          margin: "xl",
          contents: [
            {
              type: "text",
              text: formattedTime,
              size: "3xl",
              weight: "bold",
              color: config.timeColor,
              align: "center",
            },
            {
              type: "text",
              text: "เวลาที่บันทึก",
              size: "xxs",
              color: "#aaaaaa",
              align: "center",
              margin: "sm",
            },
            // Insert status badge if available
            ...(statusBadge ? [statusBadge] : []),
          ],
        }),
      ],
    }),
  });
}

// =============================================================================
// 2. Flex: แจ้งสถานะวันนี้ (Status Today / Summary)
// =============================================================================

function attendanceStatusMessage(
  timestamp,
  workingTime,
  date,
  isHeaderWarning = false
) {
  const headerText = isHeaderWarning ? "⚠️ สรุปเวลาทำงาน" : "📋 สรุปเวลาทำงาน";
  const headerColor = isHeaderWarning ? "#E65100" : "#0288D1";

  return atoms.makeFlex("สถานะเวลาทำงาน", {
    ...buildBubble({
      title: { text: headerText, color: headerColor },
      subTitle: {
        text: `วันที่ ${dayjs(date).format("D MMM YYYY")}`,
        color: "#666666",
      },
      contents: [
        atoms.boxColumns({
          contents: [
            // เข้างาน / เริ่มพัก
            atoms.boxRows({
              contents: [
                _smartTimeBox(
                  "เข้างาน",
                  timestamp?.start_time,
                  workingTime?.start_time,
                  date,
                  "work_in"
                ),
                _smartTimeBox(
                  "เริ่มพัก",
                  timestamp?.break_start_time,
                  workingTime?.break_start_time,
                  date,
                  "break_in"
                ),
              ],
            }),

            atoms.separator("md"),

            // เข้างาน(บ่าย) / เลิกงาน
            atoms.boxRows({
              margin: "md",
              contents: [
                _smartTimeBox(
                  "เข้างาน(บ่าย)",
                  timestamp?.break_end_time,
                  workingTime?.break_end_time,
                  date,
                  "break_out"
                ),
                _smartTimeBox(
                  "เลิกงาน",
                  timestamp?.end_time,
                  workingTime?.end_time,
                  date,
                  "work_out"
                ),
              ],
            }),

            // OT Check - เข้า OT / เลิก OT
            ...(timestamp?.ot_start_time || workingTime?.ot_start_time
              ? [
                  atoms.separator("md"),

                  atoms.boxRows({
                    margin: "md",
                    contents: [
                      _smartTimeBox(
                        "OT เข้า",
                        timestamp?.ot_start_time,
                        workingTime?.ot_start_time,
                        date,
                        "ot_in"
                      ),
                      _smartTimeBox(
                        "OT ออก",
                        timestamp?.ot_end_time,
                        workingTime?.ot_end_time,
                        date,
                        "ot_out"
                      ),
                    ],
                  }),
                ]
              : []),
          ],
        }),
        atoms.separator("md"),

        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "หมายเหตุ:",
              size: "sm",
              color: "#222222",
              weight: "bold",
              margin: "sm",
            },
          ],
          margin: "md",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "🟢 ตรงเวลา",
              size: "xs",

              color: "#00B900",
              align: "center",
              flex: 1,
            },
            {
              type: "text",
              text: "🔴 สาย",
              size: "xs",
              color: "#E65100",
              align: "center",
              flex: 1,
            },
            {
              type: "text",
              text: "⚠️ แจ้งลืม",
              size: "xs",
              color: "#FF3333",
              align: "center",
              flex: 1,
            },
          ],
        },
      ],
    }),
  });
}

module.exports = {
  attendanceSuccessMessage,
  attendanceStatusMessage,
};
