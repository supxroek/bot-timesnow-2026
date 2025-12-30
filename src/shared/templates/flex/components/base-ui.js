// src/shared/templates/flex/components/base-ui.js
// ฟังก์ชันสำหรับสร้างองค์ประกอบพื้นฐานของ LINE Flex Messages

// โลโก้ที่จัดกึ่งกลาง
function logoCenter(url, size = "full", aspectRatio = "20:5") {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "image",
        url:
          url ||
          "https://liff-timesnow-2024.web.app/assets/images/logo_timenow_bottom.png",
        size: size,
        align: "center",
        gravity: "center",
        aspectMode: "fit",
        aspectRatio: aspectRatio,
      },
    ],
    alignItems: "center",
    // spacing: "sm",
    // margin: "md",
    paddingBottom: "sm",
  };
}

// ข้อความหัวเรื่อง
function titleText(text) {
  return {
    type: "text",
    text: text || "",
    weight: "bold",
    size: "lg",
    align: "center",
    wrap: true,
    margin: "xs",
  };
}

// ข้อความหัวเรื่องย่อย
function subTitleText(text, color = "#1DB446") {
  return {
    type: "text",
    text: text || "",
    size: "sm",
    align: "center",
    color,
    wrap: true,
    margin: "xs",
  };
}

// แถวข้อมูลแบบป้ายกำกับและค่า
function infoRow(label, value) {
  // Use a 2:4 ratio for label/value and align value to start so long values wrap naturally
  return {
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: label || "",
        size: "sm",
        color: "#6f6f6f",
        flex: 2,
        wrap: true,
        align: "start",
      },
      {
        type: "text",
        text: value || "",
        size: "sm",
        color: "#222222",
        align: "start",
        flex: 4,
        wrap: true,
      },
    ],
    margin: "xs",
  };
}

// ตัวแบ่งแนวนอน
function separator(margin = "sm") {
  return {
    type: "separator",
    margin,
  };
}

module.exports = {
  logoCenter,
  titleText,
  subTitleText,
  infoRow,
  separator,
};
