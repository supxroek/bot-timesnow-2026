const db = require("../../shared/config/db.config");

class ForgetRequest {
  // สร้างคำร้องใหม่
  async create(data) {
    const {
      request_id,
      employee_id,
      company_id,
      timestamp_type,
      forget_date,
      forget_time,
      reason,
      evidence,
      status = "pending",
    } = data;

    const sql = `
      INSERT INTO forget_timestamp_requests 
      (request_id, employee_id, company_id, timestamp_type, forget_date, forget_time, reason, evidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      request_id,
      employee_id,
      company_id,
      timestamp_type,
      forget_date,
      forget_time,
      reason,
      evidence,
      status,
    ]);

    return result;
  }

  // ค้นหาคำร้องด้วย ID
  async findById(id) {
    const [rows] = await db.query(
      "SELECT * FROM forget_timestamp_requests WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  // ค้นหาคำร้องที่รออนุมัติโดย employeeId และช่วงเวลา
  async findPendingByEmployeeAndRange(employeeId, startDate, endDate) {
    const sql = `
      SELECT * 
      FROM forget_timestamp_requests 
      WHERE employee_id = ? 
      AND status = 'pending'
      AND forget_date BETWEEN ? AND ?
    `;
    const [rows] = await db.query(sql, [employeeId, startDate, endDate]);
    return rows;
  }

  // ค้นหาคำร้องด้วย request_id
  async findByRequestId(requestId) {
    const [rows] = await db.query(
      "SELECT * FROM forget_timestamp_requests WHERE request_id = ?",
      [requestId]
    );
    return rows[0];
  }

  // ค้นหาคำร้องซ้ำ (สถานะ pending, employee, date, type เดียวกัน)
  async findPendingDuplicate(employeeId, date, type) {
    const [rows] = await db.query(
      `SELECT * FROM forget_timestamp_requests 
       WHERE employee_id = ? 
       AND forget_date = ? 
       AND timestamp_type = ? 
       AND status = 'pending'`,
      [employeeId, date, type]
    );
    return rows[0];
  }

  // อัปเดตสถานะคำร้อง (รองรับ optional transaction connection)
  async updateStatus(id, status, conn = null) {
    let sql = "UPDATE forget_timestamp_requests SET status = ?";
    const params = [status];

    if (status === "approved") {
      sql += ", approved_at = NOW()";
    }

    sql += " WHERE id = ?";
    params.push(id);

    const executor = conn || db;
    const [result] = await executor.query(sql, params);
    return result;
  }
}

module.exports = { ForgetRequest: new ForgetRequest() };
