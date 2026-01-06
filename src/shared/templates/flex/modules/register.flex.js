const { buildBubble } = require("../layouts/base-layout");
const { formatDateThai } = require("../../../utils/date");

// ฟังก์ชันซ่อนเลขบัตรประชาชน (PDPA)
const maskIDCard = (idCard) => {
  if (!idCard || idCard.length < 13) return idCard;
  return idCard.substring(0, 3) + "xxxxxx" + idCard.substring(9);
};

// ฟังก์ชันสร้างรายละเอียดข้อมูลผู้ใช้
const buildUserInfoContents = ({ name, maskedID, formattedDate }) => [
  {
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: "ชื่อ-สกุล",
        color: "#aaaaaa",
        size: "sm",
        flex: 2,
      },
      {
        type: "text",
        text: name || "-",
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
        text: "เลขบัตรฯ",
        color: "#aaaaaa",
        size: "sm",
        flex: 2,
      },
      {
        type: "text",
        text: maskedID || "-",
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
        text: "เริ่มงาน",
        color: "#aaaaaa",
        size: "sm",
        flex: 2,
      },
      {
        type: "text",
        text: formattedDate || "-",
        wrap: true,
        color: "#666666",
        size: "sm",
        flex: 4,
      },
    ],
  },
];

// ==============================================================
// ข้อความแจ้งรอการอนุมัติ (Pending Approval)
const registerPendingMessage = (data) => {
  const { name, IDCard, start_date } = data || {};
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  const bubble = buildBubble({
    title: "รอการอนุมัติ",
    subTitle: { text: "Pending Approval", color: "#F59E0B" },
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "คำขอลงทะเบียนของคุณอยู่ระหว่างการพิจารณา",
            wrap: true,
            align: "center",
            color: "#666666",
            size: "sm",
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
            contents: buildUserInfoContents({ name, maskedID, formattedDate }),
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "กรุณารอการอนุมัติจากผู้ดูแลระบบ ระบบจะแจ้งผลให้ทราบผ่าน LINE เมื่อดำเนินการเสร็จสิ้น",
            wrap: true,
            align: "center",
            color: "#666666",
            size: "sm",
            margin: "lg",
          },
        ],
      },
    ],
    footerText: "Time Now - Smart Attendance System",
  });

  return {
    type: "flex",
    altText: "รอการอนุมัติ - คำขอลงทะเบียนของคุณอยู่ระหว่างพิจารณา",
    contents: bubble,
  };
};

// ==============================================================
// ข้อความแจ้งผลการอนุมัติสำเร็จ (Approved)
const registerApprovedMessage = (data) => {
  const { name, IDCard, start_date } = data || {};
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  const bubble = buildBubble({
    title: "อนุมัติเรียบร้อย",
    subTitle: { text: "Welcome to Time Now", color: "#00B900" },
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ยินดีต้อนรับเข้าสู่ครอบครัวของเรา",
            wrap: true,
            align: "center",
            color: "#666666",
            size: "sm",
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
            contents: buildUserInfoContents({ name, maskedID, formattedDate }),
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "คุณสามารถเริ่มใช้งานระบบบันทึกเวลาได้ทันทีผ่านเมนูที่ปรากฏด้านล่าง",
            wrap: true,
            align: "center",
            color: "#666666",
            size: "sm",
            margin: "lg",
          },
        ],
      },
    ],
    footerText: "Time Now - Smart Attendance System",
  });

  return {
    type: "flex",
    altText: "อนุมัติเรียบร้อย! ยินดีต้อนรับสู่ Time Now",
    contents: bubble,
  };
};

// ==============================================================
// ข้อความแจ้งผลการปฏิเสธ (Rejected)
const registerRejectedMessage = (data) => {
  const { name, IDCard, start_date, reason } = data || {};
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  const bubble = buildBubble({
    title: "ไม่อนุมัติ",
    subTitle: { text: "Registration Rejected", color: "#EF4444" },
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ขออภัย คำขอลงทะเบียนของคุณไม่ได้รับการอนุมัติ",
            wrap: true,
            align: "center",
            color: "#666666",
            size: "sm",
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
              ...buildUserInfoContents({ name, maskedID, formattedDate }),
              ...(reason
                ? [
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
                          text: reason,
                          wrap: true,
                          color: "#EF4444",
                          size: "sm",
                          flex: 4,
                        },
                      ],
                    },
                  ]
                : []),
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "หากมีข้อสงสัย กรุณาติดต่อฝ่ายบุคคลของบริษัท",
            wrap: true,
            align: "center",
            color: "#666666",
            size: "sm",
            margin: "lg",
          },
        ],
      },
    ],
    footerText: "Time Now - Smart Attendance System",
  });

  return {
    type: "flex",
    altText: "ไม่อนุมัติ - คำขอลงทะเบียนของคุณถูกปฏิเสธ",
    contents: bubble,
  };
};

module.exports = {
  registerPendingMessage,
  registerApprovedMessage,
  registerRejectedMessage,
  maskIDCard,
};
