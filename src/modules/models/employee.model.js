/**
 * src/modules/models/employee.model.js
 *
 * โมเดลสำหรับข้อมูลสมาชิก
 */

const db = require("../../shared/config/db.config");
const { normalizeDate } = require("../../shared/utils/date");

// ============================================================
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

// ============================================================
// class สำหรับข้อมูลสมาชิก
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

  // ค้นหาสมาชิกโดยใช้ lineUserId
  async findByLineUserId(lineUserId) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE lineUserId = ?",
      [lineUserId]
    );
    return rows[0];
  }

  // ค้นหาสมาชิกโดยใช้ id
  async findById(id) {
    const [rows] = await db.query("SELECT * FROM employees WHERE id = ?", [id]);
    return rows[0];
  }

  // นับจำนวนพนักงานในบริษัท
  async countByCompanyId(companyId) {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM employees WHERE companyId = ? AND (resign_date IS NULL OR resign_date > CURDATE())",
      [companyId]
    );
    return rows[0].count;
  }

  // ค้นหาสมาชิกด้วย CompanyId และ IDCard
  async findByCompanyAndIdCard(companyId, idCard) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE companyId = ? AND ID_or_Passport_Number = ?",
      [companyId, idCard]
    );
    return rows[0];
  }

  // ค้นหาสมาชิกที่ยังทำงานอยู่ด้วย lineUserId และ companyId
  async findActiveByLineUserIdAndCompany(lineUserId, companyId) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE lineUserId = ? AND companyId = ? AND (resign_date IS NULL OR resign_date > CURDATE())",
      [lineUserId, companyId]
    );
    return rows[0];
  }

  // อัปเดตข้อมูลสมาชิก
  async update(id, memberData) {
    const { name, IDCard, companyId, lineUserId, start_date, resign_date } =
      memberData;
    const normalizedStart = normalizeDate(start_date);

    // Build query dynamically or just update all fields
    const [rows] = await db.query(
      "UPDATE employees SET name = ?, ID_or_Passport_Number = ?, companyId = ?, lineUserId = ?, start_date = ?, resign_date = ? WHERE id = ?",
      [
        name,
        IDCard,
        companyId,
        lineUserId,
        normalizedStart,
        resign_date || null,
        id,
      ]
    );
    return rows;
  }

  // สร้างสมาชิกใหม่
  async create(memberData) {
    const { name, IDCard, companyId, lineUserId, start_date, departmentId } =
      memberData;

    const normalizedStart = normalizeDate(start_date);
    const [rows] = await db.query(
      "INSERT INTO employees (name, ID_or_Passport_Number, companyId, lineUserId, start_date, departmentId) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        IDCard,
        companyId,
        lineUserId,
        normalizedStart,
        departmentId || null,
      ]
    );
    return rows;
  }

  // ตรวจสอบว่า lineUserId นี้ลงทะเบียนแล้วหรือไม่ (ยังทำงานอยู่)
  async isAlreadyRegistered(lineUserId, companyId) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE lineUserId = ? AND companyId = ? AND (resign_date IS NULL OR resign_date > CURDATE())",
      [lineUserId, companyId]
    );
    return rows.length > 0;
  }

  // ตรวจสอบว่า IDCard นี้ลงทะเบียนแล้วหรือไม่ (ยังทำงานอยู่)
  async isIdCardAlreadyRegistered(idCard, companyId) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE ID_or_Passport_Number = ? AND companyId = ? AND (resign_date IS NULL OR resign_date > CURDATE())",
      [idCard, companyId]
    );
    return rows.length > 0;
  }

  // ตรวจสอบสถานะการลงทะเบียน (สำหรับ check status API)
  async checkRegistrationStatus(lineUserId, idCard, companyId) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE (lineUserId = ? OR ID_or_Passport_Number = ?) AND companyId = ? AND (resign_date IS NULL OR resign_date > CURDATE())",
      [lineUserId, idCard, companyId]
    );
    return rows[0];
  }

  // ค้นหาพนักงานที่ลาออกแล้ว (รวมทั้งที่ยังทำงานอยู่)
  async findResignedEmployee(lineUserId, idCard, companyId) {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE (lineUserId = ? OR ID_or_Passport_Number = ?) AND companyId = ?",
      [lineUserId, idCard, companyId]
    );
    return rows[0];
  }

  // อัพเดทข้อมูลและ reactivate พนักงานที่ลาออก
  async reactivateEmployee(id, memberData) {
    const { name, IDCard, lineUserId, start_date } = memberData;
    const normalizedStart = normalizeDate(start_date);

    const [rows] = await db.query(
      "UPDATE employees SET name = ?, ID_or_Passport_Number = ?, lineUserId = ?, start_date = ?, resign_date = NULL WHERE id = ?",
      [name, IDCard, lineUserId, normalizedStart, id]
    );
    return rows;
  }
}

module.exports = {
  Companies: new Companies(),
  Employee: new Employee(),
};
