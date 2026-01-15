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
function titleText(text, color = "#000000") {
  return {
    type: "text",
    text: text || "",
    weight: "bold",
    size: "lg",
    align: "center",
    color,
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

// ข้อความทั่วไป
function baseText(value = {}) {
  return {
    type: "text",
    text: value.text || "",
    weight: value.weight,
    size: value.size || "sm",
    align: value.align,
    color: value.color || "#222222",
    wrap: value.wrap || true,
    maxLines: value.maxLines,
    margin: value.margin || "sm",
  };
}

// ข้อความหมายเหตุ
function noteText(text, color = "#8c8c8c") {
  return {
    type: "text",
    text: `${text || ""}`,
    size: "xs",
    align: "center",
    color,
    wrap: true,
    margin: "sm",
  };
}

// ปุ่ม
function button(value = {}) {
  return {
    type: "button",
    style: value.style || "primary",
    height: value.height || "sm",
    action: value.action || {},
    margin: value.margin || "md",
  };
}

// กล่องแบบแถว
function boxRows(value = {}) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: value.spacing || "sm",
    contents: value.contents || [],
    margin: value.margin || "sm",
  };
}

// กล่องแบบคอลัมน์
function boxColumns(value = {}) {
  return {
    type: "box",
    layout: "vertical",
    spacing: value.spacing || "sm",
    contents: value.contents || [],
    margin: value.margin || "sm",
  };
}

// แถวข้อมูลแบบมีย่อหน้า
function buildBullet(text, color) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      { type: "text", text: " ", size: "sm", flex: 0 },
      {
        type: "text",
        text,
        size: "sm",
        color: color || "#111111",
        wrap: true,
        flex: 6,
      },
    ],
    margin: "sm",
  };
}

// แถวข้อมูลแบบป้ายกำกับและค่า
function infoRow(label, value) {
  // Use a 2:4 ratio for label/value and align value to start so long values wrap naturally
  return {
    type: "box",
    layout: "horizontal",
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
    margin: "sm",
  };
}

// แถวข้อมูลแบบป้ายกำกับและค่าที่จัดเป็นคอลัมน์
function infoColumns(label, value) {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: label || "",
        size: "sm",
        color: "#6f6f6f",
        wrap: true,
        align: "start",
      },
      {
        type: "text",
        text: value || "",
        size: "sm",
        color: "#222222",
        align: "start",
        wrap: true,
      },
    ],
    margin: "sm",
  };
}

// แถวข้อมูลแบบแบ่ง rows between
function infoRowsBetween(label, value) {
  return {
    type: "box",
    layout: "horizontal",
    justifyContent: "space-between",
    contents: [
      {
        type: "text",
        text: label || "",
        size: "sm",
        color: "#6f6f6f",
        wrap: true,
        align: "start",
      },
      {
        type: "text",
        text: value || "",
        size: "sm",
        color: "#222222",
        align: "end",
        wrap: true,
      },
    ],
    margin: "sm",
  };
}

// แถวข้อมูลแบบแบ่ง columns between
function infoColumnsBetween(label, value) {
  return {
    type: "box",
    layout: "vertical",
    justifyContent: "space-between",
    contents: [
      {
        type: "text",
        text: label || "",
        size: "sm",
        color: "#222222",
        wrap: true,
        align: "start",
      },
      {
        type: "text",
        text: value || "",
        size: "sm",
        color: "#6f6f6f",
        align: "start",
        wrap: true,
      },
    ],
    margin: "sm",
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
  baseText,
  noteText,
  button,
  boxRows,
  boxColumns,
  buildBullet,
  infoRow,
  infoColumns,
  infoRowsBetween,
  infoColumnsBetween,
  separator,
};
