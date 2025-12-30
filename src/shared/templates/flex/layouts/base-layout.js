// src/shared/templates/flex/layouts/base-layout.js
// ฟังก์ชันสำหรับสร้างเลย์เอาต์พื้นฐานของ LINE Flex Messages

const atoms = require("../components/base-ui");

// ฟังก์ชันสร้าง Bubble layout
function buildBubble({
  logoUrl,
  title,
  subTitle = {},
  contents = [],
  footerText = "",
} = {}) {
  const header = {
    type: "box",
    layout: "vertical",
    contents: [
      atoms.logoCenter(logoUrl, "full", "10:2"),
      atoms.titleText(title),
      atoms.subTitleText(subTitle.text || "", subTitle.color || "#1DB446"),
    ],
    spacing: "sm",
    paddingBottom: "md",
  };

  const body = {
    type: "box",
    layout: "vertical",
    contents: Array.isArray(contents) ? contents : [],
    spacing: "sm",
    // paddingTop: "sm",
  };

  const footer = {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: footerText || `Copyright © ${new Date().getFullYear() } Inverz Solutions Co., Ltd.`,
        size: "xxs",
        color: "#8c8c8c",
        align: "center",
        wrap: true,
      },
    ],
  };

  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      contents: [header, atoms.separator("sm"), body],
    },
    footer,
  };
}

module.exports = {
  buildBubble,
};
