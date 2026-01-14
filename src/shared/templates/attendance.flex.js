/**
 * src/shared/templates/attendance.flex.js
 * Flex Message Template for Monthly Attendance Report
 */

const attendanceReport = (data) => {
  const { period, employeeName, stats, dailyStatuses } = data;

  const workStats = `${stats.totalWorkDays} วัน`;
  // If lateminutes > 0, show details, else just 0
  const lateStats =
    stats.totalLateCount > 0
      ? `${stats.totalLateCount} ครั้ง (${stats.totalLateMinutes} น.)`
      : "0 ครั้ง";

  const leaveStats = `${stats.totalLeaves} วัน`;
  const absentStats = `${stats.totalAbsent} วัน`;
  const swapStats = `${stats.swapCount} วัน`;

  // Daily Rows
  const rows = dailyStatuses.map((day) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: day.date.substring(0, 5),
        size: "xs",
        color: "#888888",
        flex: 1,
      }, // Show only dd/mm to save space if needed
      {
        type: "text",
        text: day.status,
        size: "xs",
        color: day.color,
        flex: 3,
        wrap: true,
      },
    ],
    margin: "sm",
  }));

  return {
    type: "flex",
    altText: "สรุปประวัติการทำงานประจำเดือน",
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สรุปประวัติการทำงาน",
            weight: "bold",
            size: "xl",
            color: "#1DB446",
          },
          {
            type: "text",
            text: period,
            size: "sm",
            color: "#555555",
            margin: "xs",
          },
          {
            type: "text",
            text: `พนักงาน: ${employeeName}`,
            size: "sm",
            weight: "bold",
            margin: "md",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Stats Grid Row 1
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "มาทำงาน",
                    size: "xxs",
                    color: "#aaaaaa",
                  },
                  {
                    type: "text",
                    text: workStats,
                    size: "sm",
                    weight: "bold",
                    color: "#3b82f6",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "มาสาย",
                    size: "xxs",
                    color: "#aaaaaa",
                  },
                  {
                    type: "text",
                    text: lateStats,
                    size: "sm",
                    weight: "bold",
                    color: "#f59e0b",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "หยุดชดเชย",
                    size: "xxs",
                    color: "#aaaaaa",
                  },
                  {
                    type: "text",
                    text: swapStats,
                    size: "sm",
                    weight: "bold",
                    color: "#10b981",
                  },
                ],
              },
            ],
          },
          // Stats Grid Row 2
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "การลา",
                    size: "xxs",
                    color: "#aaaaaa",
                  },
                  {
                    type: "text",
                    text: leaveStats,
                    size: "sm",
                    weight: "bold",
                    color: "#f59e0b",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "ขาด/ลืม",
                    size: "xxs",
                    color: "#aaaaaa",
                  },
                  {
                    type: "text",
                    text: absentStats,
                    size: "sm",
                    weight: "bold",
                    color: "#ef4444",
                  },
                ],
              },
              { type: "filler" },
            ],
          },
          { type: "separator", margin: "lg" },
          {
            type: "text",
            text: "รายการประจำวัน",
            weight: "bold",
            size: "sm",
            margin: "lg",
            color: "#333333",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: rows,
          },
        ],
      },
    },
  };
};

module.exports = { attendanceReport };
