const mainEmailLayout = require("../layouts/main-email");
const { formatDateThai } = require("../../../utils/date");

const registerRequestEmail = ({ name, IDCard, start_date, approveLink }) => {
  const formattedDate = formatDateThai(start_date);

  const content = `
    <h2>คำขอลงทะเบียนพนักงานใหม่</h2>
    <p>เรียน ผู้ดูแลระบบ/ฝ่ายบุคคล,</p>
    <p>มีพนักงานใหม่ได้ทำการลงทะเบียนเข้าสู่ระบบ Time Now รายละเอียดดังนี้:</p>
    
    <div class="info-box">
        <div class="info-row">
            <span class="info-label">ชื่อ-นามสกุล:</span>
            <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">เลขบัตรประชาชน:</span>
            <span class="info-value">${IDCard}</span>
        </div>
        <div class="info-row">
            <span class="info-label">วันที่เริ่มงาน:</span>
            <span class="info-value">${formattedDate}</span>
        </div>
    </div>
    
    <p>กรุณาตรวจสอบข้อมูลและดำเนินการอนุมัติหรือปฏิเสธคำขอได้ที่ปุ่มด้านล่างนี้</p>
    
    <div class="btn-container">
        <a href="${approveLink}" class="btn">ตรวจสอบและอนุมัติ</a>
    </div>
    
    <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
        หากลิงก์ด้านบนไม่ทำงาน กรุณาคัดลอกและวาง URL นี้ในเบราว์เซอร์ของคุณ:<br>
        <a href="${approveLink}" style="color: #0284c7; word-break: break-all;">${approveLink}</a>
    </p>
  `;

  return mainEmailLayout(content, "คำขอลงทะเบียนพนักงานใหม่ - Time Now");
};

module.exports = {
  registerRequestEmail,
};
