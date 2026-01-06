/**
 * src/modules/models/attendance.model.js
 *
 * โมเดลสำหรับข้อมูลการลงเวลางาน
 */

const db = require("../../shared/config/db.config");
const { normalizeDate } = require("../../shared/utils/date");

// class สำหรับข้อมูลการลงเวลางาน
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

module.exports = new Attendance();
