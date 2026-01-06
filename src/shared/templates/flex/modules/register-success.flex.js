const { buildBubble } = require("../layouts/base-layout");
const { formatDateThai } = require("../../../utils/date");

// ฟังก์ชันซ่อนเลขบัตรประชาชน (PDPA)
const maskIDCard = (idCard) => {
  if (!idCard || idCard.length < 13) return idCard;
  return idCard.substring(0, 3) + "xxxxxx" + idCard.substring(9);
};

const registerSuccessMessage = (data) => {
  const { name, IDCard, start_date } = data || {};
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  const bubble = buildBubble({
    title: "ลงทะเบียนสำเร็จ",
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
            contents: [
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
            ],
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
    altText: "ลงทะเบียนสำเร็จ! ยินดีต้อนรับสู่ Time Now",
    contents: bubble,
  };
};

module.exports = {
  registerSuccessMessage,
};
