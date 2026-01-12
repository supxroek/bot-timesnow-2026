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

    for (const row of rows) {
      if (
        this.checkId(row.employeeId, employeeId) &&
        this.isMatch(row, month, dayOfMonth, dayOfWeek)
      ) {
        return row;
      }
    }

    return null;
  }

  /**
   * Helper to check ID list
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
      console.error("Error in checkId:", err);
      return false;
    }
  }

  /**
   * Helper to check Date list
   * @param {string} listStr
   * @param {number} targetVal
   * @returns {boolean}
   */
  checkDate(listStr, targetVal) {
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
  }

  /**
   * Check if the row matches the date criteria
   * @param {object} row
   * @param {number} month
   * @param {number} dayOfMonth
   * @param {number} dayOfWeek
   * @returns {boolean}
   */
  isMatch(row, month, dayOfMonth, dayOfWeek) {
    if (row.month && row.date) {
      return row.month === month && this.checkDate(row.date, dayOfMonth);
    } else if (!row.month && row.date) {
      return this.checkDate(row.date, dayOfWeek);
    } else if (!row.month && !row.date) {
      return true;
    }
    return false;
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
