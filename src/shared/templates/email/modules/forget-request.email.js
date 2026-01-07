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
 * @param {string} [data.evidence] หลักฐาน (URL)
 * @param {string} data.approveLink ลิงก์สำหรับอนุมัติ (มี token)
 * @param {string} [data.originalTime] เวลาเดิม (ถ้ามี)
 * @returns {string} HTML Email
 */
const forgetRequestEmail = ({
  name,
  department,
  date,
  time,
  type,
  reason,
  evidence,
  approveLink,
  originalTime,
}) => {
  const evidenceHtml = evidence
    ? `
      <tr>
        <td style="padding: 5px 0; color: #dc3545; font-size: 14px; vertical-align: top;">หลักฐาน:</td>
        <td style="padding: 5px 0; color: #334155; font-size: 12px; vertical-align: top;">
           <a href="${evidence}" target="_blank" style="color: #0284c7; text-decoration: underline;">ดูหลักฐานแนบ</a>
        </td>
      </tr>
    `
    : "";

  const content = `
    <h2>คำขอลืมบันทึกเวลา</h2>
    <p>เรียน ผู้ดูแลระบบ/ฝ่ายบุคคล,</p>
    <p>มีพนักงานแจ้งคำขอลืมบันทึกเวลาเข้ามา โดยมีรายละเอียดดังนี้:</p>
      
    <div class="info-box">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; width: 35%; vertical-align: top;">ชื่อ-นามสกุล:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;"><b>${name}</b></td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">แผนก:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${
                  department || "-"
                }</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">วันที่:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${date}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">ประเภท:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${type}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">เวลาเดิม:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${
                  originalTime || "-"
                }</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">เวลาที่ขอ:</td>
                <td style="padding: 5px 0; color: #0284c7; font-size: 14px; font-weight: bold; vertical-align: top;">${time}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">เหตุผล:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${reason}</td>
            </tr>
            ${evidenceHtml}
        </table>
    </div>
  
    <div class="btn-container">
        ${
          evidence
            ? `<p style="text-align: center; color: #dc3545; font-size: 14px; margin-bottom: 15px;">* โปรดตรวจสอบหลักฐานที่แนบมาด้วย ก่อนทำการอนุมัติ</p>`
            : ""
        }
        <a href="${approveLink}" class="btn">
          ตรวจสอบและอนุมัติ
        </a>
        <p style="margin-top: 15px; font-size: 12px; color: #999;">
          ลิงก์นี้มีอายุการใช้งาน 30 วัน
        </p>
    </div>
    `;

  return mainEmailLayout(content, "คำขออนุมัติลืมลงเวลา - Time Now");
};

module.exports = { forgetRequestEmail };
