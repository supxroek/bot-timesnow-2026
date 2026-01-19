const atoms = require("../../flex/components/base-ui");
const { buildBubble } = require("../../flex/layouts/base-layout");

function beaconNotFoundFlex() {
  return atoms.makeFlex("ไม่พบสัญญาณ Beacon", {
    ...buildBubble({
      title: { text: "⚠️ ไม่สามารถลงเวลาได้", color: "#FF3333" },
      subTitle: { text: "ท่านไม่อยู่ในบริเวณจุดลงเวลา", color: "#FF3333" },
      contents: [
        atoms.baseText({
          text: "เนื่องจากท่านไม่ได้อยู่ในพื้นที่ โปรดตรวจสอบว่าท่านอยู่ในบริเวณจุดลงเวลาแล้ว หากท่านอยู่ในพื้นที่แล้วแต่ยังพบข้อผิดพลาดนี้",
        }),

        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: "กรุณาลองทำตามคำแนะนำดังต่อไปนี้:",
              weight: "bold",
              size: "sm",
              color: "#222222",
              margin: "sm",
            }),

            // แสดงรายการหมายเลขกำกับ
            atoms.infoNumberedRow(1, "ตรวจสอบว่าท่านอยู่ในบริเวณจุดลงเวลา"),
            atoms.infoNumberedRow(2, "ตรวจสอบว่า Bluetooth ในโทรศัพท์ของท่านเปิดอยู่"),
            atoms.infoNumberedRow(3, "ลองรีเฟรช หรือปิด App LINE แล้วเปิดใหม่อีกครั้ง"),
            atoms.infoNumberedRow(4, "หากยังพบปัญหา กรุณาติดต่อฝ่ายบุคคล"),


          ],
        }),
      ],
    }),
  });
}

function noShiftFlex() {
  return atoms.makeFlex("ไม่พบกะงาน", {
    ...buildBubble({
      title: { text: "ℹ️ ไม่พบกะงาน", color: "#FF8C00" },
      subTitle: { text: "ไม่มีข้อมูลกะงานสำหรับท่านในขณะนี้", color: "#FF8C00" },
      contents: [
        atoms.baseText({
          text: "ระบบไม่พบกะงานที่ตรงกับข้อมูลของท่านในช่วงเวลานี้",
        }),

        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: "คำแนะนำ:",
              weight: "bold",
              size: "sm",
              color: "#222222",
              margin: "sm",
            }),

            // แสดงรายการหมายเลขกำกับ
            atoms.infoNumberedRow(1, "ตรวจสอบว่าท่านได้ลงทะเบียนบัญชีและกะงานถูกกำหนดเรียบร้อยแล้ว"),
            atoms.infoNumberedRow(2, "ติดต่อฝ่ายบุคคลเพื่อให้กำหนดกะงานให้ท่าน"),
            atoms.infoNumberedRow(3, "ลองรีเฟรช หรือออกจากระบบแล้วเข้าสู่ระบบอีกครั้ง"),

          ],
        }),
      ],
    }),
  });
}

module.exports = { beaconNotFoundFlex, noShiftFlex };
