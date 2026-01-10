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
  now = dayjs()
) => {
  // สร้าง content หลัก
  let contentComponent;

  if (timeVal) {
    // 1. กรณีมีเวลาลงบันทึกแล้ว
    const formattedTime =
      timeVal.length > 5 ? timeVal.substring(0, 5) : timeVal;
    contentComponent = {
      type: "text",
      text: formattedTime,
      size: "xl",
      weight: "bold",
      color: "#333333",
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
        type: "button",
        action: {
          type: "uri",
          label: "แจ้งลืม",
          uri: "https://liff.line.me/2006755947-3C7TBS5B",
        },
        height: "sm",
        style: "link",
        color: "#0288D1",
        margin: "none",
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

const attendanceSuccessMessage = ({
  actionLabel,
  time,
  date,
  isDuplicate = false,
}) => {
  const headerColor = isDuplicate ? "#E65100" : "#1B5E20"; // Orange vs Green
  const titleText = isDuplicate ? "⚠️ คุณลงเวลาไปแล้ว" : "บันทึกเวลาสำเร็จ";
  const timeColor = isDuplicate ? "#666666" : "#00B900";

  const contents = [
    // Header Section
    {
      type: "text",
      text: titleText,
      weight: "bold",
      size: "xl",
      color: headerColor,
      align: "center",
      margin: "md",
    },
    {
      type: "text",
      text: isDuplicate
        ? `ระบบพบข้อมูล ${actionLabel} ในช่วงเวลานี้แล้ว`
        : `บันทึกข้อมูล ${actionLabel} เรียบร้อยแล้ว`,
      size: "sm",
      color: "#666666",
      wrap: true,
      align: "center",
      margin: "md",
    },
    atoms.separator("lg"),
    // Detail Section
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "วันที่",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: dayjs(date).format("D MMM YYYY"),
              wrap: true,
              color: "#666666",
              size: "sm",
              flex: 4,
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "รายการ",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: actionLabel,
              wrap: true,
              color: "#333333",
              size: "sm",
              flex: 4,
              weight: "bold",
            },
          ],
        },
        // Big Time Display
        {
          type: "box",
          layout: "vertical",
          margin: "xl",
          contents: [
            {
              type: "text",
              text: time ? time.substring(0, 5) : "--:--",
              size: "4xl",
              weight: "bold",
              color: timeColor,
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
          ],
        },
      ],
    },
  ];

  const bubble = buildBubble({
    title: isDuplicate ? "แจ้งเตือน" : "ลงเวลาสำเร็จ",
    contents: contents,
    footerText: isDuplicate
      ? "หากต้องการแก้ไข กรุณาแจ้งหัวหน้างาน"
      : "ขอบคุณที่ตั้งใจทำงานครับ",
  });

  return {
    type: "flex",
    altText: isDuplicate ? "คุณลงเวลาไปแล้ว" : `ลงเวลา ${actionLabel} สำเร็จ`,
    contents: bubble,
  };
};

// =============================================================================
// 2. Flex: แจ้งสถานะวันนี้ (Status Today / Summary)
// =============================================================================

const attendanceStatusMessage = ({
  timestamp,
  workingTime,
  date,
  isHeaderWarning = false,
}) => {
  const headerText = isHeaderWarning ? "⚠️ สรุปเวลาทำงาน" : "📋 สรุปเวลาทำงาน";
  const headerColor = isHeaderWarning ? "#E65100" : "#0288D1";

  const contents = [
    {
      type: "text",
      text: headerText,
      weight: "bold",
      size: "xl",
      color: headerColor,
      align: "center",
      margin: "md",
    },
    {
      type: "text",
      text: `วันที่ ${dayjs(date).format("D MMM YYYY")}`,
      size: "xs",
      color: "#666666",
      align: "center",
      margin: "sm",
    },
    atoms.separator("lg"),
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "md",
      contents: [
        // Row 1: เข้างาน, เริ่มพัก
        {
          type: "box",
          layout: "horizontal",
          contents: [
            _smartTimeBox(
              "เข้างาน",
              timestamp?.start_time,
              workingTime?.start_time,
              date
            ),
            _smartTimeBox(
              "เริ่มพัก",
              timestamp?.break_start_time,
              workingTime?.break_start_time,
              date
            ),
          ],
        },
        atoms.separator("sm"),
        // Row 2: กลับพัก (บ่าย), เลิกงาน (สลับตำแหน่ง StartPM/End ตาม Request)
        {
          type: "box",
          layout: "horizontal",
          contents: [
            _smartTimeBox(
              "เข้างาน(บ่าย)",
              timestamp?.break_end_time,
              workingTime?.break_end_time,
              date
            ),
            _smartTimeBox(
              "เลิกงาน",
              timestamp?.end_time,
              workingTime?.end_time,
              date
            ),
          ],
        },
        // Row 3: OT Check
        ...(timestamp?.ot_start_time ||
        timestamp?.ot_end_time ||
        workingTime?.ot_start_time ||
        workingTime?.ot_end_time
          ? [
              atoms.separator("sm"),
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  _smartTimeBox(
                    "OT เข้า",
                    timestamp?.ot_start_time,
                    workingTime?.ot_start_time,
                    date
                  ),
                  _smartTimeBox(
                    "OT ออก",
                    timestamp?.ot_end_time,
                    workingTime?.ot_end_time,
                    date
                  ),
                ],
              },
            ]
          : []),
      ],
    },
  ];

  const bubble = buildBubble({
    title: "สถานะเวลาทำงาน",
    contents: contents,
    footerText: isHeaderWarning
      ? "ระบบไม่พบการดำเนินการใหม่"
      : "ตรวจสอบเวลาของคุณ",
  });

  return {
    type: "flex",
    altText: "สรุปเวลาทำงานวันนี้",
    contents: bubble,
  };
};

module.exports = { attendanceSuccessMessage, attendanceStatusMessage };
