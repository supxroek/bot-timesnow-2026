const { buildBubble } = require("../layouts/base-layout");
const atoms = require("../components/base-ui");

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

// 1. Pending Notification - แจ้งลืมลงเวลา (อัพเดทใหม่)
function forgetRequestPendingMessage(date, time, type) {
  const typeText = getTypeText(type);

  return atoms.makeFlex("แจ้งลืมลงเวลา", {
    ...buildBubble({
      title: { text: "แจ้งลืมลงเวลา", color: "#FFA500" },
      subTitle: {
        text: "คำขอของคุณถูกส่งไปยัง HR แล้ว กรุณารอผลการอนุมัติ",
        color: "#666666",
      },
      contents: [
        atoms.infoRowsBetween({ text: "วันที่" }, { text: date }),
        atoms.infoRowsBetween({ text: "ประเภท" }, { text: typeText }),
        atoms.infoRowsBetween({ text: "เวลา" }, { text: time }),
        atoms.infoRowsBetween({ text: "สถานะ" }, { text: "รออนุมัติ", color: "#FF9900", weight: "bold" }),
      ],
    }),
  });
}

// 2. Approved Notification - อนุมัติคำขอ (อัพเดทใหม่)
function forgetRequestApprovedMessage(date, time, type) {
  const typeText = getTypeText(type);

  return atoms.makeFlex("อนุมัติคำขอ", {
    ...buildBubble({
      title: { text: "อนุมัติคำขอ", color: "#00B900" },
      subTitle: {
        text: "คำขอของคุณได้รับการอนุมัติและบันทึกเข้าระบบเรียบร้อยแล้ว",
        color: "#666666",
      },
      contents: [
        atoms.infoRowsBetween({ text: "วันที่" }, { text: date }),
        atoms.infoRowsBetween({ text: "ประเภท" }, { text: typeText }),
        atoms.infoRowsBetween({ text: "เวลา" }, { text: time }),
        atoms.infoRowsBetween({ text: "สถานะ" }, { text: "อนุมัติแล้ว", color: "#00B900", weight: "bold" }),
      ],
    })
  });
}

// 3. Rejected Notification - ปฏิเสธคำขอ (อัพเดทใหม่)
function forgetRequestRejectedMessage(date, time, type, reason) {
  const typeText = getTypeText(type);

  return atoms.makeFlex("ปฏิเสธคำขอ", {
    ...buildBubble({
      title: { text: "ปฏิเสธคำขอ", color: "#FF3333" },
      subTitle: {
        text: "คำขอของคุณถูกปฏิเสธ กรุณาตรวจสอบรายละเอียดด้านล่าง",
        color: "#666666",
      },
      contents: [
        atoms.infoRowsBetween({ text: "วันที่" }, { text: date }),
        atoms.infoRowsBetween({ text: "ประเภท" }, { text: typeText }),
        atoms.infoRowsBetween({ text: "เวลา" }, { text: time }),
        atoms.infoRowsBetween({ text: "สถานะ" }, { text: "ปฏิเสธ", color: "#FF3333", weight: "bold" }),
        atoms.infoRowsBetween({ text: "เหตุผล" }, { text: reason || "-", color: "#666666" }),
      ],
    }),
  });
}

module.exports = {
  forgetRequestPendingMessage,
  forgetRequestApprovedMessage,
  forgetRequestRejectedMessage,
};
