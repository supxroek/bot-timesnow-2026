const db = require("../../shared/config/db.config");

class DevIOModel {
  /**
   * ค้นหาอุปกรณ์ตาม HWID
   * @param {string} hwid
   * @returns {Promise<object>}
   */
  async findByHWID(hwid) {
    const sql = `SELECT * FROM devIO WHERE HWID = ? LIMIT 1`;
    const [rows] = await db.query(sql, [hwid]);
    return rows[0];
  }

  /**
   * ค้นหาอุปกรณ์ตาม CompanyId
   * @param {number} companyId
   * @returns {Promise<array>}
   */
  async findByCompanyId(companyId) {
    const sql = `SELECT * FROM devIO WHERE companyId = ?`;
    const [rows] = await db.query(sql, [companyId]);
    return rows;
  }
}

module.exports = new DevIOModel();
