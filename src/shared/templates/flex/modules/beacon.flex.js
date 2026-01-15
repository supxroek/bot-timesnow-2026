// src/shared/templates/flex/modules/beacon.flex.js

const atoms = require("../components/base-ui");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

// ตั้งค่าโซนเวลาเริ่มต้นเป็น Asia/Bangkok
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bangkok");

// ฟังก์ชันเรียกใช้รูปตามช่วงเวลา เช่น เช้า บ่าย เย็น เป็นต้น
const getTimeBasedImageUrl = () => {
  const hour = dayjs().hour();
  if (hour >= 5 && hour < 12) {
    // เช้า
    return "https://images.unsplash.com/photo-1676197401406-e632c230e93d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxMHx8fGVufDB8fHx8fA%3D%3D";
  } else if (hour >= 12 && hour < 18) {
    // บ่าย
    return "https://images.unsplash.com/photo-1601121789653-315b872ee856?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwxfHx8ZW58MHx8fHx8";
  } else if (hour >= 18 && hour < 22) {
    // เย็น
    return "https://images.unsplash.com/photo-1748443766737-f917e20a4d63?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXwzfHx8ZW58MHx8fHx8";
  } else {
    // ดึก
    return "https://images.unsplash.com/photo-1745531702766-38d8faf45a28?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxib29rbWFya3MtcGFnZXw4fHx8ZW58MHx8fHx8";
  }
};

// ฟังก์ชันเมื่อพบ LINE Beacon (กรณียังไม่ลงเวลา)
function beaconDetectedFlex(deviceName, actionLabel, actionTime) {
  return atoms.makeFlex("พบจุดลงเวลา", {
    type: "bubble",

    // hero section
    hero: atoms.heroImage({
      url: getTimeBasedImageUrl(),
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    }),

    // body section
    body: atoms.boxColumns({
      contents: [
        atoms.baseText({
          text: "📍 LINE Beacon Detected",
          weight: "bold",
          size: "xl",
          color: "#1DB446",
        }),

        atoms.baseText({
          text: "ระบบพบสัญญาณ LINE Beacon ของจุดลงเวลา",
          size: "md",
          color: "#555555",
          margin: "sm",
        }),

        atoms.baseText({
          text: `แนะนำ: ${actionLabel || "ลงเวลา"}`,
          weight: "bold",
          size: "lg",
          color: "#333333",
          margin: "md",
        }),

        atoms.baseText({
          text: `วันที่: ${dayjs().format("DD/MM/YYYY")}`,
          size: "md",
          color: "#555555",
          margin: "sm",
        }),

        atoms.baseText({
          text: `เวลา: ${actionTime || "-"}`,
          size: "md",
          color: "#555555",
          margin: "sm",
        }),

        atoms.baseText({
          text: `อุปกรณ์: ${deviceName || "Unknown Device"}`,
          size: "md",
          color: "#555555",
          margin: "sm",
        }),
      ],
    }),

    // footer section
    footer: atoms.boxColumns({
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          action: {
            type: "message",
            label: `👉 บันทึกเวลา${actionLabel || "ลงเวลา"}`,
            text: actionLabel || "ลงเวลา",
          },
          color: "#03C75A",
        },
      ],
      flex: 0,
    }),
  });
}

module.exports = { beaconDetectedFlex };
