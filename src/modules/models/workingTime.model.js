const db = require("../../shared/config/db.config");
const dayjs = require("dayjs");

class WorkingTimeModel {
  /**
   * ค้นหากะการทำงานของพนักงานในวันที่ระบุ (โดยคำนึงถึง Priority)
   * Priority:
   * 1. Specific Date (ระบุวันและเดือนชัดเจน) - is_specific = 1, month = X, date contains D
   * 2. Weekly Pattern (ระบุวันในสัปดาห์) - month is NULL, date contains WeekDay (Sun=0...Sat=6 or 1-7?)
   * 3. Default (ไม่ระบุวัน) - date is NULL/Empty
   *
   * @param {number} employeeId
   * @param {number} companyId
   * @param {string} dateString รูปแบบ 'YYYY-MM-DD'
   * @returns {Promise<object>}
   */
  async findByEmployeeAndDate(employeeId, companyId, dateString) {
    const d = dayjs(dateString);
    const dayOfMonth = d.date(); // 1-31
    const month = d.month() + 1; // 1-12
    const dayOfWeek = d.day() === 0 ? 7 : d.day(); // 1(Mon) - 7(Sun) -- Adjust per your conventions if needed.
    // Usually JS: 0=Sun, 1=Mon. Let's assume database uses 1=Mon..7=Sun or 1=Sun..7=Sat?
    // User data example: "Date: [1..6]" for 'Normally'.  Likely 1=Mon.

    // ดึงกะทั้งหมดของบริษัทมาก่อน แล้วกรองใน Code (เนื่องจาก JSON filter ซับซ้อนใน SQL)
    const sql = `SELECT * FROM workingTime WHERE companyId = ? ORDER BY is_specific DESC, id DESC`;
    const [rows] = await db.query(sql, [companyId]);

    // Helper to check ID list
    const checkId = (listStr, targetId) => {
      if (!listStr) return false;
      try {
        const clean = String(listStr).replaceAll(/[\\[\]"]/g, "");
        const ids = clean.split(",").map((s) => s.trim());
        return ids.includes(String(targetId));
      } catch (err) {
        console.error("Error in checkId:", err);
        return false;
      }
    };

    // Helper to check Date list
    const checkDate = (listStr, targetVal) => {
      if (!listStr) return false;
      try {
        const clean = String(listStr).replaceAll(/[\\[\]"]/g, "");
        // Some entries might be integers in JSON, some strings.
        const vals = clean.split(",").map((s) => Number.parseInt(s.trim()));
        return vals.includes(targetVal);
      } catch (err) {
        console.error("Error in checkDate:", err);
        return false;
      }
    };

    for (const row of rows) {
      // 1. Must include employeeId
      if (!checkId(row.employeeId, employeeId)) continue;

      // 2. Check Match Logic
      // Case A: Specific Month & Date (Annual/Specific Shift)
      if (row.month && row.date) {
        if (row.month === month && checkDate(row.date, dayOfMonth)) {
          return row;
        }
      }
      // Case B: No month, but has Date (Weekly Pattern?)
      // Assumption: If month is null and date exists, it works as Day of Week filter
      else if (!row.month && row.date) {
        if (checkDate(row.date, dayOfWeek)) {
          return row;
        }
      }
      // Case C: No date, No month (Default/General)
      else if (!row.month && !row.date) {
        return row;
      }
    }

    return null;
  }

  /**
   * สร้างกะการทำงานใหม่ (กรณี Free Time หรือ Fallback)
   * @param {object} data
   * @returns {Promise<number>} insertId
   */
  async create(data) {
    const {
      companyId,
      employeeId,
      date,
      month,
      free_time = 0,
      start_time = null,
      end_time = null,
      break_start_time = null,
      break_end_time = null,
    } = data;

    const sql = `
      INSERT INTO workingTime 
      (companyId, employeeId, date, month, free_time, start_time, end_time, break_start_time, break_end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      companyId,
      employeeId,
      date,
      month,
      free_time,
      start_time,
      end_time,
      break_start_time,
      break_end_time,
    ]);
    return result.insertId;
  }
}

module.exports = new WorkingTimeModel();
