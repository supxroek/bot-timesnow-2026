const db = require("../../shared/config/db.config");
const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const logger = require("../../shared/utils/logger");
dayjs.extend(isBetween);

class OvertimeModel {
  /**
   * ค้นหาสิทธิ์การทำ OT ของพนักงานในช่วงเวลาปัจจุบัน
   * @param {number} employeeId
   * @param {number} companyId
   * @param {string} currentTimeStr เวลาปัจจุบัน 'HH:mm:ss'
   * @returns {Promise<object|null>} คืนค่ารายการ OT หากพบและมีสิทธิ์, มิฉะนั้น null
   */
  async findActiveOvertime(employeeId, companyId, currentTimeStr) {
    const sql = `SELECT * FROM overtime WHERE companyId = ?`;
    const [rows] = await db.query(sql, [companyId]);

    // แปลงเวลาปัจจุบันเป็น Date object เพื่อเปรียบเทียบ
    // อนุมานว่า currentTimeStr เป็น 'HH:mm:ss'
    // เราจะใช้ Dummy Date เพื่อเปรียบเทียบเวลาเท่านั้น
    const now = dayjs(`2000-01-01 ${currentTimeStr}`);

    for (const row of rows) {
      if (!this.checkId(row.employeeId, employeeId)) {
        continue;
      }

      const start = dayjs(`2000-01-01 ${row.ot_start_time}`);
      const end = dayjs(`2000-01-01 ${row.ot_end_time}`);

      // ตรวจสอบว่าเวลาปัจจุบันอยู่ในช่วง OT หรือไม่
      // กรณีข้ามวัน (Start > End) ยังไม่รองรับใน Logic นี้แบบง่ายๆ แต่ตามปกติ OT อาจจะไม่ข้ามวันใน Context นี้ หรือถ้าข้ามวันต้องดู Start/End
      // สมมติว่าในวันเดียวกันก่อน
      if (now.isBetween(start, end, null, "[]")) {
        return row;
      }
    }

    return null;
  }

  /**
   * Helper to check ID list (Employee IDs stored as JSON or CSV string)
   * @param {string} listStr
   * @param {number} targetId
   * @returns {boolean}
   */
  checkId(listStr, targetId) {
    if (!listStr) return false;
    try {
      const clean = String(listStr).replaceAll(/[\\[\]"]/g, "");
      const ids = clean.split(",").map((s) => s.trim());
      return ids.includes(String(targetId));
    } catch (err) {
      logger.error("[OvertimeModel] Error in checkId:", err);
      return false;
    }
  }
}

module.exports = new OvertimeModel();
