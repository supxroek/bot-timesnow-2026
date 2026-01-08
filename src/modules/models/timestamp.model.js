const db = require("../../shared/config/db.config");

class TimestampRecord {
  // ค้นหา record โดย employeeId และ date
  // ปรับปรุง query ให้ยืดหยุ่นขึ้น โดยรองรับกรณีหาผ่าน workingTime ไม่เจอ ให้ดูที่ created_at ของ timestamp_records แทน (เฉพาะวันที่ตรงกัน)
  async findByEmployeeAndDate(employeeId, date, conn = null) {
    const sql = `
      SELECT tr.*, wt.date as wt_date
      FROM timestamp_records tr
      LEFT JOIN workingTime wt ON tr.workingTimeId = wt.id
      WHERE tr.employeeid = ? 
      AND (
        wt.date = ? 
        OR wt.date LIKE ?
        OR DATE(tr.created_at) = ?
      )
      ORDER BY tr.id DESC
      LIMIT 1
    `;
    const executor = conn || db;
    const dateLike = date + "%";
    const [rows] = await executor.query(sql, [
      employeeId,
      date,
      dateLike,
      date,
    ]);
    return rows[0];
  }

  // ค้นหา record โดย employeeId และช่วงเวลา (สำหรับ Scanner Scanner)
  async findByEmployeeAndDateRange(
    employeeId,
    startDate,
    endDate,
    conn = null
  ) {
    const sql = `
      SELECT 
        wt.date,
        wt.free_time,
        tr.otStatus,
        tr.start_time,
        tr.end_time,
        tr.break_start_time,
        tr.break_end_time,
        tr.ot_start_time,
        tr.ot_end_time,
        tr.created_at
      FROM workingTime wt
      LEFT JOIN timestamp_records tr ON wt.id = tr.workingTimeId
      WHERE wt.employeeId = ?
      AND wt.date BETWEEN ? AND ?
      ORDER BY wt.date ASC
    `;
    const executor = conn || db;
    const [rows] = await executor.query(sql, [employeeId, startDate, endDate]);
    return rows;
  }

  // สร้าง workingTime (ตารางแม่)
  async createWorkingTime(
    { companyId, employeeId, date, month, free_time = 0 },
    conn = null
  ) {
    const sql = `
        INSERT INTO workingTime (companyId, employeeId, date, month, free_time)
        VALUES (?, ?, ?, ?, ?)
      `;
    const executor = conn || db;
    const [result] = await executor.query(sql, [
      companyId,
      employeeId,
      date,
      month,
      free_time,
    ]);
    return result.insertId;
  }

  // สร้าง timestamp_records
  async createTimestamp(
    { employeeid, workingTimeId, companyId, ...times },
    conn = null
  ) {
    // times เช่น { start_time: '08:00:00' }
    const keys = Object.keys(times);
    const values = Object.values(times);

    // สร้าง query dynamic ตาม field ที่ส่งมา
    const fields = ["employeeid", "workingTimeId", "companyId", ...keys];
    const placeholders = fields.map(() => "?").join(", ");

    const sql = `INSERT INTO timestamp_records (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;

    const executor = conn || db;
    const [result] = await executor.query(sql, [
      employeeid,
      workingTimeId,
      companyId,
      ...values,
    ]);
    return result;
  }

  // อัปเดต timestamp_records
  async updateTimestamp(id, updates, conn = null) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updates);

    const sql = `UPDATE timestamp_records SET ${setClause} WHERE id = ?`;
    const executor = conn || db;
    const [result] = await executor.query(sql, [...values, id]);
    return result;
  }
}

module.exports = { TimestampRecord: new TimestampRecord() };
