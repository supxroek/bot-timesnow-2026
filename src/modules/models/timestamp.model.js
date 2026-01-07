const db = require("../../shared/config/db.config");

class TimestampRecord {
  // ค้นหา record โดย employeeId และ date
  // ต้อง Join กับ workingTime เพราะ timestamp_records ไม่มี field date โดยตรง (อ้างอิง Schema)
  async findByEmployeeAndDate(employeeId, date, conn = null) {
    const sql = `
      SELECT tr.*, wt.date
      FROM timestamp_records tr
      JOIN workingTime wt ON tr.workingTimeId = wt.id
      WHERE tr.employeeid = ? AND wt.date = ?
    `;
    const executor = conn || db;
    const [rows] = await executor.query(sql, [employeeId, date]);
    return rows[0];
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
