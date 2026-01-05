/**
 * src/modules/models/members.model.js
 *
 * โมเดลสำหรับข้อมูลสมาชิก
 */

const db = require("../../shared/config/db.config");
const { normalizeToDate } = require("../../shared/utils/date");

// โมเดลสำหรับข้อมูลบริษัท
class Companies {
  // ค้นหาบริษัทด้วย id
  async findById(id) {
    const [rows] = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
    return rows[0];
  }

  // ดึงบริษัททั้งหมด
  async companyAll() {
    const [rows] = await db.query("SELECT * FROM companies");
    return rows;
  }
}

// โมเดลสำหรับข้อมูลสมาชิก
class Employee {
  // ค้นหาสมาชิกโดยใช้ userId
  async findOne({ where: { userId } }) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE lineUserId = ?",
      [userId]
    );
    return rows[0];
  }

  // ค้นหาสมาชิกที่ยังไม่ลาออกโดยใช้ userId
  async findActiveByLineUserId({ where: { userId } }) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE lineUserId = ? AND (resign_date IS NULL OR resign_date > CURDATE())",
      [userId]
    );
    return rows[0];
  }

  // สร้างสมาชิกใหม่
  async create(memberData) {
    const { name, IDCard, companyId, lineUserId, start_date } = memberData;

    const normalizedStart = normalizeToDate(start_date);
    const [rows] = await db.query(
      "INSERT INTO employees (name, ID_or_Passport_Number, companyId, lineUserId, start_date) VALUES (?, ?, ?, ?, ?)",
      [name, IDCard, companyId, lineUserId, normalizedStart]
    );
    return rows;
  }
}

// โมเดลสำหรับข้อมูลการลงเวลางาน
class Attendance {
  // ค้นหาการลงเวลางานด้วย id
  async findById(id) {
    const [rows] = await db.query("SELECT * FROM attendance WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  // ดึงการลงเวลางานทั้งหมด
  async attendanceAll() {
    const [rows] = await db.query("SELECT * FROM attendance");
    return rows;
  }

  // สร้างการลงเวลางานใหม่
  async create(attendanceData) {
    const { userId, date, timeIn, timeOut } = attendanceData;
    const [rows] = await db.query(
      "INSERT INTO attendance (userId, date, timeIn, timeOut) VALUES (?, ?, ?, ?)",
      [userId, date, timeIn, timeOut]
    );
    return rows;
  }

  // อัปเดตการลงเวลางาน
  async update(id, attendanceData) {
    const { timeIn, timeOut } = attendanceData;
    const [rows] = await db.query(
      "UPDATE attendance SET timeIn = ?, timeOut = ? WHERE id = ?",
      [timeIn, timeOut, id]
    );
    return rows;
  }
}

module.exports = {
  Companies: new Companies(),
  Employee: new Employee(),
  Attendance: new Attendance(),
};
