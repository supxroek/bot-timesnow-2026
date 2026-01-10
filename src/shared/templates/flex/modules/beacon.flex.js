// src/shared/templates/flex/modules/beacon.flex.js

const makeFlex = (altText, contents) => ({
  type: "flex",
  altText,
  contents,
});

const beaconDetectedFlex = (deviceName, actionLabel, actionTime) =>
  makeFlex("พบจุดลงเวลา", {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRpbWUlMjBjbG9ja3xlbnwwfHwwfHx8MA%3D%3D",
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📍 พบจุดลงเวลา",
          weight: "bold",
          size: "xl",
          color: "#1DB446",
        },
        {
          type: "text",
          text: `แนะนำ: ${actionLabel || "ลงเวลา"}`,
          weight: "bold",
          size: "xl",
          color: "#333333",
          margin: "md",
        },
        {
          type: "text",
          text: `เวลา: ${actionTime || "-"}`,
          size: "md",
          color: "#555555",
          margin: "sm",
        },
        {
          type: "text",
          text: `อุปกรณ์: ${deviceName || "Unknown Device"}`,
          size: "xs",
          color: "#aaaaaa",
          margin: "xs",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          action: {
            type: "message",
            label: `👉 ${actionLabel || "ลงเวลา"}`,
            text: actionLabel || "ลงเวลา",
          },
          color: "#03C75A",
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "message",
            label: "เมนูหลัก",
            text: "help",
          },
        },
      ],
      flex: 0,
    },
  });

module.exports = { beaconDetectedFlex };
