/**
 * src/modules/models/members.model.js
 *
 * โมเดลสำหรับข้อมูลสมาชิก
 */

const db = require("../../shared/config/db.config");

class Member {
  create(memberData) {
    const { userId, name, email } = memberData;
    const [rows] = db.query(
      "INSERT INTO members (userId, name, email) VALUES (?, ?, ?)",
      [userId, name, email]
    );
    return rows;
  }
}

module.exports = new Member();
