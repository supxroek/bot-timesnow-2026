// src/shared/templates/flex/modules/greeting.flex.js
// Greeting module that composes Flex messages using base UI atoms and base layout

const atoms = require("../components/base-ui");
const base = require("../layouts/base-layout");

// small helper to render a bullet line with emoji and text
function buildBullet(text, color) {
  return {
    type: "box",
    layout: "baseline",
    spacing: "xs",
    contents: [
      { type: "text", text: " ", size: "xs", flex: 0 },
      {
        type: "text",
        text,
        size: "xs",
        color: color || "#111111",
        wrap: true,
        flex: 6,
      },
    ],
    margin: "xs",
  };
}

// intents keywords
const INTENTS = {
  // General greetings and common phrases - สำหรับคำทักทายทั่วไปและวลีที่ใช้บ่อย
  GREETING: ["hello", "hi", "hey", "สวัสดี", "หวัดดี", "ดีจ้า", "ดีครับ"],
  HELP: ["help", "support", "ช่วยเหลือ", "ช่วยด้วย"],
  THANKS: ["thank", "thanks", "appreciate", "ขอบคุณ", "ขอบใจ"],

  // Specific service inquiries - สำหรับการสอบถามบริการเฉพาะ
  REGISTERATION: ["register", "sign up", "สมัคร", "ลงทะเบียน"],
  ATTENDANCE_IN: [
    "check in",
    "attendance in",
    "เช็คอิน",
    "ลงชื่อเข้าใช้",
    "เข้างาน",
    "บันทึกเวลาเข้างาน",
  ],
  ATTENDANCE_OUT: [
    "check out",
    "attendance out",
    "เช็คเอาท์",
    "ลงชื่อออก",
    "ออกงาน",
    "บันทึกเวลาออกงาน",
  ],
  FORGOT_ATTENDANCE: [
    "forgot attendance",
    "ลืมบันทึกเวลา",
    "ลืมเช็คอิน",
    "ลืมเช็คเอาท์",
  ],
  WORK_CALCULATION: [
    "work hours",
    "calculate work",
    "คำนวณชั่วโมงทำงาน",
    "คำนวณเวลางาน",
  ],
};

function pickExamples() {
  // pick a representative sample (not exhaustive)
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return [
    pick(INTENTS.GREETING),
    pick(INTENTS.HELP),
    pick(INTENTS.REGISTERATION),
    pick(INTENTS.ATTENDANCE_IN),
    pick(INTENTS.ATTENDANCE_OUT),
    pick(INTENTS.FORGOT_ATTENDANCE),
    pick(INTENTS.WORK_CALCULATION),
  ];
}

// =================================================================================
// Generic greeting bubble
function greetingFlex() {
  const bubble = base.buildBubble({
    title: "สวัสดี 👋",
    subTitle: { text: "ยินดีต้อนรับสู่ Leave Hub", color: "#1DB446" },
    contents: [
      {
        type: "text",
        text: "🚀 พัฒนาขึ้นเพื่อแก้ปัญหา การบันทึกเวลาเข้าออกงานแบบ Manual ที่ยุ่งยาก ช้า และผิดพลาดบ่อย",
        wrap: true,
        size: "sm",
        color: "#6f6f6f",
        maxLines: 3,
        margin: "xs",
      },

      atoms.separator("sm"),

      // Problems section
      {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "ปัญหาที่แก้",
            weight: "bold",
            size: "sm",
            color: "#222222",
            margin: "xs",
          },
          buildBullet("❌ เจ้าหน้าที่จดมือ → ช้า+ผิด", "#FF4B4B"),
          buildBullet("❌ ไม่รู้เวลาจริง (สาย/ลา)", "#FF4B4B"),
          buildBullet("❌ รายงานสรุปช้า 1-2 วัน", "#FF4B4B"),
          buildBullet("❌ พนักงานโต้แย้งข้อมูล", "#FF4B4B"),
        ],
        margin: "xs",
      },

      atoms.separator("sm"),

      // Features section
      {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "คุณสมบัติ (Features)",
            weight: "bold",
            size: "sm",
            color: "#222222",
            margin: "xs",
          },
          buildBullet("✅ บันทึกเช็คอิน/เอาท์ ผ่าน LINE Beacon", "#1DB446"),
          buildBullet("🔔 แจ้งเตือนสถานะเรียลไทม์", "#1DB446"),
          buildBullet("📊 รายงานสรุปอัตโนมัติ", "#1DB446"),
          buildBullet("🚀 แจ้งคำขอลืมลงเวลา", "#1DB446"),
          buildBullet("📱 เช็คสถานะผ่าน LIFF", "#1DB446"),
        ],
        margin: "xs",
      },
    ],
  });

  return { type: "flex", altText: "สวัสดีจาก Leave Hub", contents: bubble };
}

// =================================================================================
// Welcome a newly registered user — show their name and basic instructions
function welcomeNewUserFlex(name = "ผู้ใช้ใหม่") {
  const bubble = base.buildBubble({
    title: "ยินดีต้อนรับ",
    subTitle: { text: `สวัสดี ${name}`, color: "#1DB446" },
    contents: [
      {
        type: "text",
        text: `ยินดีต้อนรับ ${name}! เราพร้อมช่วยให้การบันทึกเวลาทำงานเป็นเรื่องง่ายและแม่นยำ`,
        size: "sm",
        color: "#555555",
        wrap: true,
        maxLines: 2,
        margin: "xs",
      },

      atoms.separator("sm"),

      atoms.infoRow("ชื่อ:", name),
      atoms.infoRow("เริ่มต้นใช้งาน:", 'พิมพ์ "เมนู" เพื่อเรียกเมนูหลัก'),
      atoms.infoRow("เช็คอิน/เอาท์:", "ใช้ LINE Beacon หรือเมนู LIFF"),

      atoms.separator("sm"),

      {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "เคล็ดลับเริ่มต้น",
            weight: "bold",
            size: "sm",
            color: "#222222",
          },
          {
            type: "text",
            text: '• พิมพ์ "เช็คอิน" หรือใช้ Beacon เพื่อบันทึกเวลา\n• ใช้เมนูเพื่อดูรายการและรายงาน',
            size: "xs",
            color: "#666666",
            wrap: true,
          },
        ],
        margin: "xs",
      },
    ],
  });

  return { type: "flex", altText: `ยินดีต้อนรับ ${name}`, contents: bubble };
}

// ================================================================================
// Unknown command response
function unknownCommandFlex(cmd = "") {
  const examples = pickExamples();

  const bubble = base.buildBubble({
    title: "ไม่พบคำสั่ง",
    subTitle: { text: "ขออภัย ระบบไม่เข้าใจคำสั่งนี้", color: "#888888" },
    contents: [
      // Display the invalid command nicely
      {
        type: "box",
        layout: "vertical",
        backgroundColor: "#F5F5F5",
        cornerRadius: "md",
        paddingAll: "md",
        contents: [
          {
            type: "text",
            text: cmd ? `"${cmd}"` : '"(ว่าง)"',
            size: "sm",
            weight: "bold",
            color: "#FF4B4B",
            align: "center",
            wrap: true,
          },
        ],
        margin: "md",
      },

      atoms.separator("lg"),

      // Suggestions Header
      {
        type: "text",
        text: "ลองใช้คำสั่งเหล่านี้ดูไหมครับ?",
        size: "sm",
        weight: "bold",
        color: "#111111",
        margin: "md",
      },

      // Suggestions List
      {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        margin: "sm",
        contents: examples.map((ex) => ({
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "-", // Arrow bullet
              size: "xs",
              // color: "#1DB446", // Brand green
              flex: 1,
              align: "end",
              // offsetTop: "1px",
            },
            {
              type: "text",
              text: ex,
              size: "sm",
              color: "#333333",
              flex: 10,
              wrap: true,
            },
          ],
        })),
      },

      // atoms.separator("lg"),

      // // Call to Action
      // {
      //   type: "box",
      //   layout: "vertical",
      //   contents: [
      //     {
      //       type: "text",
      //       text: "หรือพิมพ์คำว่า",
      //       size: "xs",
      //       color: "#aaaaaa",
      //       align: "center",
      //     },
      //     {
      //       type: "button",
      //       style: "link",
      //       height: "sm",
      //       action: {
      //         type: "message",
      //         label: "ช่วยเหลือ (Help)",
      //         text: "ช่วยเหลือ",
      //       },
      //       color: "#1DB446",
      //     },
      //   ],
      //   spacing: "xs",
      //   margin: "md",
      // },
    ],
  });

  return { type: "flex", altText: "ไม่พบคำสั่ง", contents: bubble };
}

module.exports = { greetingFlex, welcomeNewUserFlex, unknownCommandFlex };
