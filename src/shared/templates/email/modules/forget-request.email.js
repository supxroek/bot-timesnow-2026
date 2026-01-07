const mainEmailLayout = require("../layouts/main-email");

/**
 * สร้าง HTML สำหรับอีเมลแจ้งคำขอลืมลงเวลา
 * @param {Object} data ข้อมูลคำขอ
 * @param {string} data.name ชื่อพนักงาน
 * @param {string} data.department แผนก
 * @param {string} data.date วันที่ลืมลงเวลา (format ไทย)
 * @param {string} data.time เวลาที่ลืม (HH:mm)
 * @param {string} data.type ประเภท (เข้างาน/ออกงาน)
 * @param {string} data.reason เหตุผล
 * @param {string} data.approveLink ลิงก์สำหรับอนุมัติ (มี token)
 * @returns {string} HTML Email
 */
const forgetRequestEmail = ({
  name,
  department,
  date,
  time,
  type,
  reason,
  approveLink,
}) => {
  const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #00B900; margin: 0;">คำขอลืมบันทึกเวลา</h2>
        <p style="color: #666; font-size: 14px;">โปรดตรวจสอบรายละเอียดคำขอ</p>
      </div>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">ชื่อ-นามสกุล:</td>
          <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 14px; text-align: right;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">แผนก:</td>
          <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 14px; text-align: right;">${
            department || "-"
          }</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">วันที่:</td>
          <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 14px; text-align: right;">${date}</td>
        </tr>
         <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">ประเภท:</td>
          <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 14px; text-align: right;">${type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">เวลาที่ระบุ:</td>
          <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 14px; text-align: right;">${time}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px; vertical-align: top;">เหตุผล:</td>
          <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 14px; text-align: right;">${reason}</td>
        </tr>
      </table>
  
      <div style="text-align: center; margin-top: 30px;">
        <a href="${approveLink}" style="background-color: #00B900; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0, 185, 0, 0.2);">
          ตรวจสอบและอนุมัติ
        </a>
        <p style="margin-top: 20px; font-size: 12px; color: #999;">
          ลิงก์นี้มีอายุการใช้งาน 24 ชั่วโมง
        </p>
      </div>
    `;

  return mainEmailLayout(content, "คำขออนุมัติลืมลงเวลา");
};

module.exports = { forgetRequestEmail };
