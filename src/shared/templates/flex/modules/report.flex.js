const { buildBubble } = require("../layouts/base-layout");
const atoms = require("../components/base-ui");

// flex สำหรับสร้างรายงานสรุปการทำงานประจำเดือน
function createReportFlex(
  period,
  leaveHubConnected,
  employeeName,
  stats = {},
  dailyStatuses = [],
) {
  // ค่าเริ่มต้นของ stats
  stats = {
    totalLateCount: 0, // จำนวนครั้งที่มาสาย
    totalLateMinutes: 0, // จำนวนเวลาที่มาสายรวม (นาที)
    totalWorkHours: 0, // จำนวนชั่วโมงทำงานปกติ
    totalLeaves: 0, // จำนวนวันลาทั้งหมด
    leaveDetails: {}, // รายละเอียดการลา (ประเภทและจำนวนวัน)
    totalAbsent: 0, // จำนวนวันขาดงาน
    swapCount: 0, // จำนวนวันหยุดชดเชย
    totalWorkDays: 0, // จำนวนวันทำงานทั้งหมด
    totalWeekdayOTHours: 0, // จำนวนชั่วโมงโอทีในวันธรรมดา
    totalHolidayOTHours: 0, // จำนวนชั่วโมงโอทีในวันหยุด
    ...stats,
  };

  // =======================================================================
  // ส่วนแสดงผลเมื่อเชื่อมต่อกับ LeaveHub
  const leaveHubContents = [
    // ข้อมูลการลาและวันหยุด (Leave & Holidays - เชื่อมจาก LeaveHub)
    atoms.baseText({ text: "การลา & วันหยุด", weight: "bold", margin: "lg" }),

    // รายละเอียดการลา
    Object.keys(stats.leaveDetails).length
      ? atoms.boxColumns({
          contents: Object.entries(stats.leaveDetails).map(([type, count]) =>
            atoms.infoRowsBetween(
              { text: `${type}` },
              { text: `${count} วัน`, weight: "bold" },
            ),
          ),
        })
      : null,

    // รายละเอียดวันหยุดชดเชย (ถ้ามี)
    stats.swapCount > 0
      ? atoms.infoRowsBetween(
          { text: "วันหยุดชดเชย" },
          { text: `${stats.swapCount} วัน`, weight: "bold" },
        )
      : null,

    // เงื่อนไข: รายการวันลาต้องมีมากกว่า 1 รายการ หรือ รายการวันลามี 1 รายการ และมีวันหยุดชดเชยอย่างน้อย 1 วัน
    // แสดงช่องว่างระหว่างบรรทัด
    Object.keys(stats.leaveDetails).length > 1 ||
    (Object.keys(stats.leaveDetails).length > 0 && stats.swapCount > 0)
      ? atoms.baseText({ text: " " })
      : null,

    // เงื่อนไข: รายการวันลาต้องมีมากกว่า 1 รายการ หรือ รายการวันลามี 1 รายการ และมีวันหยุดชดเชยอย่างน้อย 1 วัน
    // แสดงยอดรวม
    Object.keys(stats.leaveDetails).length > 1 ||
    (Object.keys(stats.leaveDetails).length > 0 && stats.swapCount > 0)
      ? atoms.infoRowsBetween(
          { text: "รวม", color: "#374151", weight: "bold" },
          {
            text: `${stats.totalLeaves + stats.swapCount} วัน`,
            weight: "bold",
          },
        )
      : null,

    // เงื่อนไข: ถ้าไม่มีรายการลาเลย แต่มีวันหยุดชดเชยเลย
    Object.keys(stats.leaveDetails).length === 0 && stats.swapCount > 0
      ? atoms.boxRows({
          backgroundColor: "#e0f2fe",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            atoms.baseText({
              text: `เยี่ยมมาก! คุณทำงานได้โดยไม่มีวันลาในเดือนนี้เลย 🎉`,
              // weight: "bold",
              // margin: "md",
              align: "center",
            }),
          ],
        })
      : null,

    // เงื่อนไข: ถ้าไม่มีรายการลาเลย และไม่มีวันหยุดชดเชยเลย
    Object.keys(stats.leaveDetails).length === 0 &&
    stats.totalLeaves === 0 &&
    stats.swapCount === 0
      ? atoms.boxRows({
          backgroundColor: "#FFEDD5",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            atoms.baseText({
              text: "คุณไม่มีการลาหรือวันหยุดชดเชยในเดือนนี้ 🎉",
              // weight: "bold",
              // margin: "md",
              align: "center",
            }),
          ],
        })
      : null,

    atoms.separator(),
  ];

  // =======================================================================
  // ส่วนรายการประจำวัน (Daily Statuses)
  const dailyContents = [
    atoms.boxColumns({
      contents: dailyStatuses.map((day) => {
        // กำหนดสีตามสถานะ
        const STATUS_COLORS = {
          normal: "#e8f5e8", // สีเขียวอ่อน (เข้มขึ้นเล็กน้อย)
          late: "#fff3cd", // สีเหลืองอ่อน (เข้มขึ้นเล็กน้อย)
          early_exit: "#fff3cd", // สีเหลืองอ่อน (เข้มขึ้นเล็กน้อย)
          absent: "#f8d7da", // สีแดงอ่อน (เข้มขึ้นเล็กน้อย)
          default: "#e9ecef", // สีเทาอ่อน (เข้มขึ้นเล็กน้อย)
        };

        // กำหนดสีสำหรับประเภทพิเศษ
        const SPECIAL_COLORS = {
          publicHoliday: "#e8f5e8", // สีเขียวอ่อน (เข้มขึ้นเล็กน้อย)
          compensatory: "#e8f5e8", // สีเขียวอ่อน (เข้มขึ้นเล็กน้อย)
          shiftSwap: "#cce7ff", // สีฟ้าอ่อน (เข้มขึ้นเล็กน้อย)
          leave: "#f8d7da", // สีแดงอ่อน (เข้มขึ้นเล็กน้อย)
          dayOff: "#6c757d", // สีเทาอ่อน (เข้มขึ้นเล็กน้อย)
        };

        // สร้างข้อความวันที่ (วันในสัปดาห์ + วันที่)
        const dateText = `${day.dayOfWeek || ""} ${day.date || ""}`.trim();

        // ==============================================================
        // กรณีเป็นวันหยุดประจำสัปดาห์ (day off) - แสดงสีอ่อนๆ ไม่มีสถานะ
        // ใช้ padded box แทน filler เพื่อให้ความสูงของแถวเท่ากับแถวอื่น
        if (day.isDayOff) {
          return {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "sm",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: dateText,
                size: "sm",
                weight: "bold",
                color: SPECIAL_COLORS.dayOff,
                flex: 1,
              },
              {
                type: "box",
                layout: "horizontal",
                flex: 3,
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    paddingAll: "3px",
                    contents: [
                      {
                        type: "text",
                        text: "วันหยุดประจำสัปดาห์",
                        size: "xs",
                        color: "#9ca3af",
                        align: "center",
                      },
                    ],
                  },
                ],
              },
            ],
          };
        }

        // ==============================================================
        // กรณีเป็นวันหยุดนักขัตฤกษ์/ชดเชย/สลับวันหยุด/วันลา - แสดงคาบเกี่ยวทั้งแถว
        // ต้องตรวจสอบด้วยว่าเชื่อมต่อกับ LeaveHub หรือไม่
        if (
          leaveHubConnected &&
          (day.isPublicHoliday ||
            day.isCompensatory ||
            day.isShiftSwap ||
            day.leaveType)
        ) {
          let specialText = "";
          let specialColor = SPECIAL_COLORS.publicHoliday;

          if (day.isPublicHoliday) {
            specialText = day.holidayName || "วันหยุดนักขัตฤกษ์";
            specialColor = SPECIAL_COLORS.publicHoliday;
          } else if (day.isCompensatory) {
            specialText = day.holidayName || "วันหยุดชดเชย";
            specialColor = SPECIAL_COLORS.compensatory;
          } else if (day.isShiftSwap) {
            specialText = "สลับวันหยุด";
            specialColor = SPECIAL_COLORS.shiftSwap;
          } else if (day.leaveType) {
            specialText = day.leaveType;
            specialColor = SPECIAL_COLORS.leave;
          }

          return {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "sm",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: dateText,
                size: "sm",
                color: "#374151",
                weight: "bold",
                flex: 1,
              },
              {
                type: "box",
                layout: "horizontal",
                flex: 3,
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: specialColor,
                    cornerRadius: "8px",
                    paddingAll: "3px",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: specialText,
                        size: "sm",
                        color: "#374151",
                        weight: "bold",
                        align: "center",
                      },
                    ],
                  },
                ],
              },
            ],
          };
        }

        // กรณีปกติ - แสดง 3 คอลัมน์: วันที่ | เวลาเข้า | เวลาออก
        const checkInColor =
          STATUS_COLORS[day.checkInStatus] || STATUS_COLORS.default;
        const checkOutColor =
          STATUS_COLORS[day.checkOutStatus] || STATUS_COLORS.default;

        // ถ้าไม่มีเวลาเข้า/ออก แสดง "-"
        const checkInText = day.checkInTime || "ไม่ลงเวลาเข้า";
        const checkOutText = day.checkOutTime || "ไม่ลงเวลาออก";

        return {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          margin: "sm",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: dateText,
              size: "sm",
              color: "#374151",
              weight: "bold",
              flex: 1,
            },
            {
              type: "box",
              layout: "horizontal",
              flex: 3,
              spacing: "sm",
              contents: [
                // เวลาเข้างาน
                day.checkInTime
                  ? {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: checkInColor,
                      cornerRadius: "8px",
                      paddingAll: "3px",
                      flex: 1,
                      contents: [
                        {
                          type: "text",
                          text: checkInText,
                          size: "sm",
                          color: "#374151",
                          weight: "bold",
                          align: "center",
                        },
                      ],
                    }
                  : {
                      type: "box",
                      layout: "vertical",
                      paddingAll: "3px",
                      flex: 1,
                      contents: [
                        {
                          type: "text",
                          text: checkInText,
                          size: "xs",
                          color: "#9ca3af",
                          align: "center",
                        },
                      ],
                    },
                // เวลาออกงาน
                day.checkOutTime
                  ? {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: checkOutColor,
                      cornerRadius: "8px",
                      paddingAll: "3px",
                      flex: 1,
                      contents: [
                        {
                          type: "text",
                          text: checkOutText,
                          size: "sm",
                          color: "#374151",
                          weight: "bold",
                          align: "center",
                        },
                      ],
                    }
                  : {
                      type: "box",
                      layout: "vertical",
                      paddingAll: "3px",
                      flex: 1,
                      contents: [
                        {
                          type: "text",
                          text: checkOutText,
                          size: "xs",
                          color: "#9ca3af",
                          align: "center",
                        },
                      ],
                    },
              ],
            },
          ],
        };
      }),
    }),
  ];

  // =======================================================================
  // เนื้อหาหลักของรายงาน
  const contents = [
    // แสดงคำอวย ถ้าไม่มีการขาดงานและมาสายเลย
    stats.totalAbsent === 0 && stats.totalLateCount === 0
      ? atoms.boxRows({
          backgroundColor: "#d1fae5",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            atoms.baseText({
              text: `เยี่ยมมาก! คุณไม่มีการขาดงานหรือมาสายในเดือนนี้เลย 🎉`,
              align: "center",
            }),
          ],
        })
      : null,

    // ===============================================
    // สรุปภาพรวมสถานะ (Attendance Statistics)
    atoms.baseText({ text: "สถิติการทำงาน", weight: "bold", margin: "lg" }),
    atoms.boxRows({
      contents: [
        // จำนวนวันที่ต้องทำงานทั้งหมด
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(
                stats.totalWorkDays + stats.totalLeaves + stats.totalAbsent,
              ),
              size: "xl",
              weight: "bold",
              align: "center",
            }),
            atoms.baseText({
              text: "วันทั้งหมด",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),

        // วันทำงานจริง
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(stats.totalWorkDays),
              size: "xl",
              weight: "bold",
              color: "#3b82f6",
              align: "center",
            }),
            atoms.baseText({
              text: "ทำงานจริง",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),

        // มาสาย
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(
                stats.totalLateMinutes > 0 ? stats.totalLateCount : 0,
              ),
              size: "xl",
              weight: "bold",
              color: "#f59e0b",
              align: "center",
            }),
            atoms.baseText({
              text: "มาสาย",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),

        // ขาดงาน
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(stats.totalAbsent),
              size: "xl",
              weight: "bold",
              color: "#ef4444",
              align: "center",
            }),
            atoms.baseText({
              text: "ขาดงาน",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),
      ],
    }),

    atoms.separator(),

    // ===============================================
    // ข้อมูลโอทีและเวลาทำงาน (Work Hours & OT)
    atoms.baseText({ text: "ชั่วโมงทำงาน", weight: "bold", margin: "lg" }),
    atoms.boxRows({
      contents: [
        // ชั่วโมงทำงานทั้งหมด
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(
                stats.totalWeekdayOTHours +
                  stats.totalWorkHours +
                  stats.totalHolidayOTHours,
              ),
              size: "xl",
              weight: "bold",
              align: "center",
            }),
            atoms.baseText({
              text: "ชั่วโมงทำงานทั้งหมด",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),

        // ชั่วโมงโอที: วันธรรมดา
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(stats.totalWeekdayOTHours),
              size: "xl",
              weight: "bold",
              color: "#10b981",
              align: "center",
            }),
            atoms.baseText({
              text: "ชั่วโมงโอที   (วันธรรมดา)",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),

        // ชั่วโมงโอที: วันหยุด
        atoms.boxColumns({
          contents: [
            atoms.baseText({
              text: String(stats.totalHolidayOTHours),
              size: "xl",
              weight: "bold",
              color: "#10b981",
              align: "center",
            }),
            atoms.baseText({
              text: "ชั่วโมงโอที   (วันหยุด)",
              size: "xs",
              align: "center",
              color: "#374151",
            }),
          ],
        }),
      ],
    }),

    atoms.separator(),

    // เงื่อนไข: แสดงส่วนการลาและวันหยุด ก็ต่อเมื่อเชื่อมต่อกับ LeaveHub
    ...(leaveHubConnected
      ? leaveHubContents.filter((c) => c !== null && c !== undefined)
      : []),

    // ===============================================
    // รายการประจำวัน (Daily Statuses)
    atoms.baseText({
      text: "รายการประจำเดือน" + period,
      weight: "bold",
      margin: "lg",
    }),
    dailyStatuses.length > 0 ? dailyContents[0] : null,
  ];

  return atoms.makeFlex(`รายงานการทำงานเดือน ${period}`, {
    ...buildBubble({
      title: { text: "รายงานการทำงาน" },
      subTitle: {
        text: "สรุปการทำงานของ " + employeeName + " สำหรับเดือน " + period,
        color: "#64748b",
      },
      // กรองเอาเฉพาะ element ที่ไม่เป็น null/undefined
      contents: contents.filter((c) => c !== null && c !== undefined),
    }),
  });
}

module.exports = { createReportFlex };
