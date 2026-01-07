const mainEmailLayout = require("../layouts/main-email");
const { formatDateThai } = require("../../../utils/date");

const registerRequestEmail = ({ name, IDCard, start_date, approveLink }) => {
  const formattedDate = formatDateThai(start_date);

  const content = `
    <h2>คำขอลงทะเบียนพนักงานใหม่</h2>
    <p>เรียน ผู้ดูแลระบบ/ฝ่ายบุคคล,</p>
    <p>มีพนักงานใหม่ได้ทำการลงทะเบียนเข้าสู่ระบบ Time Now โดยมีรายละเอียดดังนี้:</p>
    
    <div class="info-box">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; width: 35%; vertical-align: top;">ชื่อ-นามสกุล:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;"><b>${name}</b></td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">เลขบัตรประชาชน:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${IDCard}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px; vertical-align: top;">วันที่เริ่มงาน:</td>
                <td style="padding: 5px 0; color: #334155; font-size: 14px; vertical-align: top;">${formattedDate}</td>
            </tr>
        </table>
    </div>
    
    <p>กรุณาตรวจสอบข้อมูลและดำเนินการอนุมัติหรือปฏิเสธคำขอได้ที่ปุ่มด้านล่างนี้</p>
    
    <div class="btn-container">
        <a href="${approveLink}" class="btn">ตรวจสอบและอนุมัติ</a>
        <p style="margin-top: 15px; font-size: 12px; color: #999;">
          ลิงก์นี้มีอายุการใช้งาน 30 นาที
        </p>
    </div>
  
  `;

  return mainEmailLayout(content, "คำขอลงทะเบียนพนักงานใหม่ - Time Now");
};

module.exports = {
  registerRequestEmail,
};
