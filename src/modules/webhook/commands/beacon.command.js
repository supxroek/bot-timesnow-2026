const lineProvider = require("../../../shared/providers/line.provider");
const AttendanceService = require("../../services/attendance.service");
const {
  beaconDetectedFlex,
} = require("../../../shared/templates/flex/modules/beacon.flex");

// Class สำหรับจัดการ Events Beacon
class BeaconCommand {
  async handle(event) {
    const { beacon, source } = event;

    // Log ข้อมูลเบื้องต้นของเหตุการณ์บีคอน
    console.log("Beacon event received:", {
      type: beacon.type,
      hwid: beacon.hwid,
      deviceMessage: beacon.deviceMessage,
      userId: source.userId,
    });

    // อัพเดตสถานะบีคอนและตรวจสอบการทริกเกอร์
    if (["enter", "banner", "stay"].includes(beacon.type)) {
      console.log(
        `Updating beacon state for ${source.userId} with HWID ${beacon.hwid}`
      );

      // เรียกใช้บริการอัพเดตสถานะบีคอน
      AttendanceService.updateBeaconState(source.userId, beacon.hwid);

      // หากเป็นการเข้าสู่บีคอน (enter) ให้ตรวจสอบทริกเกอร์
      if (beacon.type === "enter") {
        // ตรวจสอบว่ามีทริกเกอร์ที่ตรงกับบีคอนนี้หรือไม่
        const trigger = await AttendanceService.validateBeaconTrigger(
          source.userId,
          beacon.hwid
        );

        // หากพบทริกเกอร์ที่ตรงกัน ให้ส่งข้อความตอบกลับ
        if (trigger) {
          const flexMessage = beaconDetectedFlex(
            trigger.device.name, // ชื่ออุปกรณ์
            trigger.actionLabel, // ป้ายชื่อการกระทำ
            trigger.actionTime // เวลาการกระทำ
          );

          // การป้องกัน: ตรวจสอบให้แน่ใจว่าเราตอบกลับเฉพาะผู้ใช้เท่านั้น
          if (source.type === "user") {
            // ส่งข้อความตอบกลับแบบ reply หรือ push ตามสถานะ
            await lineProvider.replyOrPush(event, flexMessage);
          } else {
            console.log(
              `Beacon event from non-user source (${source.type}). Pushing to ${source.userId} to ensure privacy.`
            );
            await lineProvider.push(source.userId, flexMessage);
          }
        }
      }
    }
  }
}

module.exports = new BeaconCommand();
