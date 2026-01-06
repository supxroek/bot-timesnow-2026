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
        body,
        html {
            margin: 0;
            padding: 0;
            width: 100% !important;
            height: 100% !important;
        }

        * {
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }

        /* Base styles */
        body {
            font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333333;
            line-height: 1.6;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        /* Header */
        .header {
            background-color: #0ea5e9;
            background: linear-gradient(180deg, #0369a1 0%, #0ea5e9 100%);
            padding: 22px 20px;
        }

        /* Logo appearance in header - softer background and subtle shadow */
        .logo-img {
            background-color: #ffffff;
            padding: 6px;
            border-radius: 8px;
            display: block;
            width: 50px;
            height: auto;
        }

        /* Content */
        .content {
            padding: 30px 20px;
        }

        .content h2 {
            color: #333333;
            margin-top: 0;
            font-size: 20px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .content p {
            margin-bottom: 15px;
            font-size: 16px;
            color: #333333;
        }

        .info-box {
            background-color: #f9f9f9;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
        }

        .info-label {
            font-weight: bold;
            width: 140px;
            color: #333333;
        }

        .info-value {
            flex: 1;
            color: #333333;
        }

        /* Button */
        .btn-container {
            text-align: center;
            margin-top: 30px;
            margin-bottom: 20px;
        }

        .btn {
            display: inline-block;
            background-color: #0284c7;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(14, 165, 233, 0.2);
            transition: background-color 0.3s;
        }

        .btn:hover {
            background-color: #0369a1;
        }

        /* Footer */
        .footer {
            padding: 20px;
            text-align: center;
            color: #999999;
            font-size: 10px;
        }

        

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                border-radius: 0;
            }

            .content {
                padding: 20px 15px;
            }

            .info-row {
                flex-direction: column;
            }

            .info-label {
                width: 100%;
                margin-bottom: 2px;
            }
        }
    </style>
</head>

<body>
    <div style="padding: 20px 0;">
        <div class="container">
            <div class="header">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td width="60" style="vertical-align: middle;">
                            <img src="https://liff-timesnow-2024.web.app/assets/images/logo_timenow_bottom.png"
                                alt="Time Now Logo" class="logo-img" style="width: 45px; height: auto; display: block;">
                        </td>
                        <td style="vertical-align: middle; padding-left: 12px;">
                            <h1
                                style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; font-family: 'Sarabun', sans-serif;">
                                Time Now</h1>
                            <p
                                style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.9; font-family: 'Sarabun', sans-serif;">
                                ระบบจัดการเวลาเข้า-ออกงาน</p>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
                <p>หากมีข้อสงสัย กรุณาติดต่อ HR หรือผู้ดูแลระบบ</p>
                <p>&copy; ${new Date().getFullYear()} Time Now. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>

</html>
  `;
};

module.exports = mainEmailLayout;
