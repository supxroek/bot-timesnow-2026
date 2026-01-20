// src/shared/templates/flex/modules/greeting.flex.js
// Greeting module that composes Flex messages using base UI atoms and base layout

const atoms = require("../components/base-ui");
const { buildBubble } = require("../layouts/base-layout");

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
  const bubble = buildBubble({
    title: { text: "ยินดีต้อนรับสู่ Time Now 👋" },
    subTitle: {
      text: "เริ่มต้นใช้งานได้ง่าย — สมัครก่อนใช้งาน",
      color: "#1DB446",
    },
    contents: [
      atoms.baseText({
        text: "🚀 Time Now คือระบบบันทึกเวลาเข้า-ออกผ่าน LINE ที่ทำให้การติดตามและรายงานเวลางานเป็นเรื่องง่ายและแม่นยำ",
        size: "sm",
        color: "#6f6f6f",
        wrap: true,
        maxLines: 3,
        margin: "sm",
      }),

      // Features section
      atoms.boxColumns({
        contents: [
          atoms.baseText({
            text: "คุณสมบัติ (Features)",
            weight: "bold",
            size: "sm",
            color: "#222222",
            margin: "sm",
          }),

          atoms.buildBullet("✅ บันทึกเช็คอิน/เอาท์ ผ่าน LINE Beacon"),
          atoms.buildBullet("🔔 แจ้งเตือนสถานะเรียลไทม์"),
          atoms.buildBullet("📊 รายงานสรุปอัตโนมัติ"),
          atoms.buildBullet("🚀 แจ้งคำขอลืมลงเวลา"),
          atoms.buildBullet("📱 เช็คสถานะผ่าน LIFF"),
        ],
      }),

      // Call-to-action: invite to register before use
      atoms.separator("md"),

      atoms.boxColumns({
        contents: [
          atoms.baseText({
            text: "ก่อนเริ่มใช้งาน กรุณาสมัครสมาชิกเพื่อเชื่อมบัญชีของคุณกับระบบ",
            weight: "bold",
            size: "sm",
          }),

          atoms.infoRow(
            { text: "วิธีสมัคร:" },
            { text: "พิมพ์ 'สมัคร' หรือกดปุ่ม 'สมัครสมาชิก' ด้านล่าง" },
          ),

          // Call to Action Button
          atoms.button({
            action: {
              type: "uri",
              label: "สมัครสมาชิก",
              uri: "https://liff.line.me/2006755947-ToZa51HW",
            },
          }),
        ],
      }),
    ],
  });

  return {
    type: "flex",
    altText: "ยินดีต้อนรับสู่ Time Now — สมัครก่อนใช้งาน",
    contents: bubble,
  };
}

// =================================================================================
// Welcome a newly registered user — show their name and basic instructions
function welcomeNewUserFlex(name = "ผู้ใช้ใหม่") {
  const bubble = buildBubble({
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

      atoms.infoRow({ text: "ชื่อ:" }, { text: name }),
      atoms.infoRow({ text: "เริ่มต้นใช้งาน:" }, { text: 'พิมพ์ "เมนู" เพื่อเรียกเมนูหลัก' }),
      atoms.infoRow({ text: "เช็คอิน/เอาท์:" }, { text: "ใช้ LINE Beacon หรือเมนู LIFF" }),

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

  const bubble = buildBubble({
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
