const { buildBubble } = require("../layouts/base-layout");
const atoms = require("../components/base-ui");

const { formatDateThai } = require("../../../utils/date");

// ฟังก์ชันซ่อนเลขบัตรประชาชน (PDPA)
const maskIDCard = (idCard) => {
  if (!idCard || idCard.length < 13) return idCard;
  return idCard.substring(0, 3) + "xxxxxx" + idCard.substring(9);
};

// ข้อความแจ้งรอการอนุมัติ (Pending Approval) อัพเดทใหม่
function registerPendingMessage(name, IDCard, start_date) {
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  return atoms.makeFlex(
    "รอการอนุมัติ - คำขอลงทะเบียนของคุณอยู่ระหว่างการพิจารณา",
    {
      ...buildBubble({
        title: { text: "รอการอนุมัติ", color: "#F59E0B" },
        subTitle: { text: "คำขอลงทะเบียนของคุณอยู่ระหว่างการพิจารณา", color: "#666666" },
        contents: [
          atoms.infoRowsBetween({ text: "ชื่อ-สกุล" },{ text: name || "-", },),
          atoms.infoRowsBetween({ text: "เลขบัตรฯ" },{ text: maskedID || "-", },),
          atoms.infoRowsBetween({ text: "เริ่มงาน" },{ text: formattedDate || "-", },),
          atoms.infoRowsBetween({ text: "สถานะ" },{ text: "รอการอนุมัติ", color: "#F59E0B", weight: "bold" },),

          atoms.separator("md"),
          atoms.noteText("กรุณารอการอนุมัติจาก HR ระบบจะแจ้งผลให้ทราบผ่าน LINE เมื่อดำเนินการเสร็จสิ้น",),
        ],
      }),
    },
  );
}

// ข้อความแจ้งผลการอนุมัติสำเร็จ (Approved) อัพเดทใหม่
function registerApprovedMessage(name, IDCard, start_date) {
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  return atoms.makeFlex("อนุมัติเรียบร้อย! ยินดีต้อนรับสู่ Time Now", {
    ...buildBubble({
      title: { text: "อนุมัติเรียบร้อย", color: "#00B900" },
      subTitle: { text: "ยินดีต้อนรับเข้าสู่ครอบครัวของเรา", color: "#666666" },
      contents: [
        atoms.infoRowsBetween({ text: "ชื่อ-สกุล", },{ text: name || "-", },),
        atoms.infoRowsBetween({ text: "เลขบัตรฯ", },{ text: maskedID || "-", },),
        atoms.infoRowsBetween({ text: "เริ่มงาน", },{ text: formattedDate || "-", },),
        atoms.infoRowsBetween({ text: "สถานะ", },{ text: "อนุมัติแล้ว", color: "#00B900", weight: "bold" },),

        atoms.separator("lg"),
        atoms.noteText("คุณสามารถเริ่มใช้งานระบบบันทึกเวลาได้ทันทีผ่านเมนูที่ปรากฏด้านล่าง",),
      ],
    }),
  });
}

// ข้อความแจ้งผลการปฏิเสธ (Rejected) อัพเดทใหม่
function registerRejectedMessage(name, IDCard, start_date, reason) {
  const formattedDate = formatDateThai(start_date);
  const maskedID = maskIDCard(IDCard);

  return atoms.makeFlex("ไม่อนุมัติ - คำขอลงทะเบียนของคุณถูกปฏิเสธ", {
    ...buildBubble({
      title: { text: "ไม่อนุมัติ", color: "#EF4444" },
      subTitle: { text: "ขออภัย คำขอลงทะเบียนของคุณไม่ได้รับการอนุมัติ", color: "#666666" },
      contents: [
        atoms.infoRowsBetween({ text: "ชื่อ-สกุล", },{ text: name || "-", },),
        atoms.infoRowsBetween({ text: "เลขบัตรฯ", },{ text: maskedID || "-", },),
        atoms.infoRowsBetween({ text: "เริ่มงาน", },{ text: formattedDate || "-", },),
        atoms.infoRowsBetween({ text: "เหตุผล", },{ text: reason || "-", color: "#EF4444" },),

        atoms.separator("lg"),
        atoms.noteText("หากมีข้อสงสัย กรุณาติดต่อฝ่ายบุคคลของบริษัท"),
      ],
    }),
  });
}

module.exports = {
  registerPendingMessage,
  registerApprovedMessage,
  registerRejectedMessage,
  maskIDCard,
};
