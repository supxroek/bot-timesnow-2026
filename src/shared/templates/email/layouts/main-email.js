/**
 * Main Email Layout
 * A responsive email template with header, body, and footer.
 */
const mainEmailLayout = (content, title = "Time Now Notification") => {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* Reset styles */
        body, html { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
        * { -webkit-text-size-adjust: none; -ms-text-size-adjust: none; }
        
        /* Base styles */
        body { font-family: 'Sarabun', 'Prompt', Arial, sans-serif; background-color: #f4f4f4; color: #333333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        
        /* Header */
        .header { background-color: #0ea5e9; padding: 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
        
        /* Content */
        .content { padding: 30px 20px; }
        .content h2 { color: #0ea5e9; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 20px; }
        .content p { margin-bottom: 15px; font-size: 16px; }
        .info-box { background-color: #f9f9f9; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 140px; color: #555; }
        .info-value { flex: 1; color: #333; }
        
        /* Button */
        .btn-container { text-align: center; margin-top: 30px; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #0ea5e9; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(14,165,233,0.2); transition: background-color 0.3s; }
        .btn:hover { background-color: #0284c7; }
        
        /* Footer */
        .footer { background-color: #333333; padding: 20px; text-align: center; color: #999999; font-size: 12px; }
        .footer p { margin: 5px 0; }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0; }
            .content { padding: 20px 15px; }
            .info-row { flex-direction: column; }
            .info-label { width: 100%; margin-bottom: 2px; }
        }
    </style>
</head>
<body>
    <div style="padding: 20px 0;">
        <div class="container">
            <div class="header">
                <h1>Time Now</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
                <p>&copy; ${new Date().getFullYear()} Time Now. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = mainEmailLayout;
