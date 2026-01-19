const { buildBubble } = require("../layouts/base-layout");

// Helper to map type key to readable text
const getTypeText = (type) => {
  const map = {
    work_in: "เข้างาน",
    work_out: "เลิกงาน",
    break_in: "เริ่มพัก",
    break_out: "เข้างาน(บ่าย)",
    ot_in: "เข้า OT",
    ot_out: "ออก OT",
  };
  return map[type] || type;
};

// 1. Pending Notification - แจ้งลืมลงเวลา (ส่งถึงผู้ใช้เมื่อส่งคำขอ)
const forgetRequestPendingMessage = ({ date, time, type }) => {
  const typeText = getTypeText(type);
  const body = [
    {
      type: "text",
      text: "แจ้งลืมลงเวลาสำเร็จ",
      weight: "bold",
      size: "xl",
      color: "#00B900",
      align: "center",
      margin: "md",
    },
    {
      type: "text",
      text: "คำขอของคุณถูกส่งไปยัง HR แล้ว กรุณารอผลการอนุมัติ",
      size: "sm",
      color: "#666666",
      wrap: true,
      align: "center",
      margin: "md",
    },
    {
      type: "separator",
      margin: "lg",
    },
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "sm",
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
              text: date,
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
              text: "ประเภท",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: typeText,
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
              text: "เวลา",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: time,
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
              text: "สถานะ",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: "รออนุมัติ",
              wrap: true,
              color: "#FF9900",
              size: "sm",
              flex: 4,
              weight: "bold",
            },
          ],
        },
      ],
    },
  ];

  const bubble = buildBubble({
    title: "แจ้งลืมลงเวลา",
    contents: body,
    footerText: "Time Now - Smart Attendance System",
  });
  return {
    type: "flex",
    altText: "แจ้งลืมลงเวลา - คำขอของคุณถูกส่งไปยัง HR แล้ว",
    contents: bubble,
  };
};

// 2. Approved Notification - อนุมัติคำขอ (ส่งถึงผู้ใช้)
const forgetRequestApprovedMessage = ({ date, time, type }) => {
  const typeText = getTypeText(type);
  const body = [
    {
      type: "text",
      text: "อนุมัติคำขอแล้ว",
      weight: "bold",
      size: "xl",
      color: "#00B900",
      align: "center",
      margin: "md",
    },
    {
      type: "text",
      text: "คำขอของคุณได้รับการอนุมัติและบันทึกเข้าระบบเรียบร้อยแล้ว",
      size: "sm",
      color: "#666666",
      wrap: true,
      align: "center",
      margin: "md",
    },
    {
      type: "separator",
      margin: "lg",
    },
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "sm",
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
              text: date,
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
              text: `${typeText} (${time})`,
              wrap: true,
              color: "#666666",
              size: "sm",
              flex: 4,
              weight: "bold",
            },
          ],
        },
      ],
    },
  ];

  const bubble = buildBubble({
    title: "อนุมัติคำขอ",
    contents: body,
    footerText: "Time Now - Smart Attendance System",
  });
  return {
    type: "flex",
    altText: "อนุมัติคำขอ - คำขอของคุณได้รับการอนุมัติ",
    contents: bubble,
  };
};

// 3. Rejected Notification - ปฏิเสธคำขอ (ส่งถึงผู้ใช้)
const forgetRequestRejectedMessage = ({ date, type, reason }) => {
  const typeText = getTypeText(type);
  const body = [
    {
      type: "text",
      text: "คำขอถูกปฏิเสธ",
      weight: "bold",
      size: "xl",
      color: "#ff334b",
      align: "center",
      margin: "md",
    },
    {
      type: "separator",
      margin: "lg",
    },
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "sm",
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
              text: date,
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
              text: "ประเภท",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: typeText,
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
              text: "เหตุผล",
              color: "#aaaaaa",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: reason || "-",
              wrap: true,
              color: "#ff334b",
              size: "sm",
              flex: 4,
            },
          ],
        },
      ],
    },
  ];

  const bubble = buildBubble({
    title: "คำขอถูกปฏิเสธ",
    contents: body,
    footerText: "Time Now - Smart Attendance System",
  });
  return {
    type: "flex",
    altText: "คำขอถูกปฏิเสธ - คำขอของคุณถูกปฏิเสธ",
    contents: bubble,
  };
};

module.exports = {
  forgetRequestPendingMessage,
  forgetRequestApprovedMessage,
  forgetRequestRejectedMessage,
};
