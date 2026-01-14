/**
 * src/modules/models/report.model.js
 *
 * Model for gathering monthly report data from Time Now and Leave Hub databases.
 * Handles Cross-Database queries.
 */

const db = require("../../shared/config/db.config");

class ReportModel {
  /**
   * Helper to execute SQL queries
   * @param {string} sql
   * @param {Array} params
   * @returns {Promise<any>}
   */
  async query(sql, params) {
    const [rows] = await db.query(sql, params);
    return rows;
  }

  /**
   * Get Employee and Company configuration
   * @param {string} lineUserId
   * @returns {Promise<object>}
   */
  async getEmployeeAndCompany(lineUserId) {
    // Added start_date. free_time is in workingTime table, so we don't fetch it here.
    const sql = `
        SELECT e.id as employeeId, e.name as employeeName, e.ID_or_Passport_Number, e.dayOff,
               e.companyId, c.report_date, c.leave_hub_company_id,
               e.start_date
        FROM employees e
        JOIN companies c ON e.companyId = c.id
        WHERE e.lineUserId = ?
    `;
    const [rows] = await db.query(sql, [lineUserId]);
    return rows[0];
  }

  /**
   * Get Public Holidays (Leave Hub - Cross DB)
   * @param {number} leaveHubCompanyId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async getPublicHolidays(leaveHubCompanyId, startDate, endDate) {
    const sql = `
        SELECT *
        FROM leaveHub.holidays
        WHERE companyId = ?
        AND date BETWEEN ? AND ?
    `;
    const [rows] = await db.query(sql, [leaveHubCompanyId, startDate, endDate]);
    return rows;
  }

  /**
   * Get Attendance Records (Time Now)
   * @param {number} employeeId
   * @param {string} startDate 'YYYY-MM-DD'
   * @param {string} endDate 'YYYY-MM-DD'
   * @returns {Promise<Array>}
   */
  async getAttendanceRecords(employeeId, startDate, endDate) {
    // timestamp_records uses created_at. We filter by DATE(created_at).
    const sql = `
        SELECT *
        FROM timestamp_records
        WHERE employeeid = ?
        AND DATE(created_at) BETWEEN ? AND ?
        ORDER BY created_at ASC
    `;
    const [rows] = await db.query(sql, [employeeId, startDate, endDate]);
    return rows;
  }

  /**
   * Get Approved Forget Timestamp Requests (Time Now)
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async getForgetRequests(employeeId, startDate, endDate) {
    const sql = `
        SELECT *
        FROM forget_timestamp_requests
        WHERE employee_id = ?
        AND status = 'approved'
        AND forget_date BETWEEN ? AND ?
    `;
    const [rows] = await db.query(sql, [employeeId, startDate, endDate]);
    return rows;
  }

  /**
   * Get Approved Leave Requests (Leave Hub - Cross DB)
   * @param {string} passportId
   * @param {number} leaveHubCompanyId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async getLeaveRequests(passportId, leaveHubCompanyId, startDate, endDate) {
    // Assuming DB name is 'leaveHub' based on requirements
    const sql = `
        SELECT lr.*, lt.name as leave_type_name
        FROM leaveHub.leave_requests lr
        JOIN leaveHub.employees le ON lr.employeeId = le.id
        JOIN leaveHub.leave_types lt ON lr.leave_type_id = lt.id
        WHERE le.ID_or_Passport_Number = ?
        AND le.companyId = ?
        AND (lr.status = 'approved' OR lr.approval_completed = '1')
        AND (
            (lr.start_date BETWEEN ? AND ?) OR
            (lr.end_date BETWEEN ? AND ?) OR
            (lr.start_date <= ? AND lr.end_date >= ?)
        )
    `;
    const [rows] = await db.query(sql, [
      passportId,
      leaveHubCompanyId,
      startDate,
      endDate,
      startDate,
      endDate,
      startDate,
      endDate,
    ]);
    return rows;
  }

  /**
   * Get Approved Swap Requests (Leave Hub - Cross DB)
   * @param {string} passportId
   * @param {number} leaveHubCompanyId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async getSwapRequests(passportId, leaveHubCompanyId, startDate, endDate) {
    const sql = `
        SELECT sr.*
        FROM leaveHub.swap_requests sr
        JOIN leaveHub.employees le ON sr.employeeId = le.id
        WHERE le.ID_or_Passport_Number = ?
        AND le.companyId = ?
        AND sr.status = 'approved'
        AND sr.new_date BETWEEN ? AND ?
    `;
    const [rows] = await db.query(sql, [
      passportId,
      leaveHubCompanyId,
      startDate,
      endDate,
    ]);
    return rows;
  }

  /**
   * Get All Working Time Configs for Company
   * @param {number} companyId
   * @returns {Promise<Array>}
   */
  async getAllWorkingTime(companyId) {
    const sql = `SELECT * FROM workingTime WHERE companyId = ? ORDER BY is_specific DESC, id DESC`;
    const [rows] = await db.query(sql, [companyId]);
    return rows;
  }
}

module.exports = new ReportModel();
