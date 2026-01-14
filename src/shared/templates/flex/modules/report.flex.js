/**
 * src/shared/templates/flex/modules/report.flex.js
 *
 * Flex Message Template for Monthly Attendance Report (Premium UX Dashboard Style)
 * Focus: Cleanliness, Hierarchy, Mobile-First UX, and Conditional Rendering.
 */

const { buildBubble } = require("../layouts/base-layout");

// Main Flex Builder
const createReportFlex = (data) => {
  const { period, employeeName, stats, dailyStatuses } = data;

  // --- Logic & Pre-calculation ---
  const hasLate = stats.totalLateCount > 0;
  const hasLeave = stats.totalLeaves > 0;
  const hasAbsent = stats.totalAbsent > 0;
  const hasSwap = stats.swapCount > 0;

  // --- Dynamic Style Helpers ---
  const subHeaderColor = "#64748b"; // Slate 500

  // 1. Stats Row Components
  const statBox = (label, value, color, isAlert = false) => ({
    type: "box",
    layout: "vertical",
    flex: 1,
    contents: [
      {
        type: "text",
        text: value.toString(),
        size: "4xl", // Main stats size
        weight: "bold",
        color: color,
        align: "center",
      },
      {
        type: "text",
        text: label,
        size: "xs", // Small label
        color: subHeaderColor,
        align: "center",
        margin: "sm",
      },
    ],
    backgroundColor: isAlert ? "#fef2f2" : "#ffffff",
    cornerRadius: "md",
    paddingAll: "lg", // Increased padding
  });

  // 2. Breakdown Section (Conditional)
  const breakdownSection = [];

  // Late Breakdown
  if (hasLate) {
    breakdownSection.push({
      type: "box",
      layout: "vertical",
      backgroundColor: "#fff7ed", // Orange 50
      cornerRadius: "md",
      paddingAll: "md",
      margin: "md",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "⚠️ สถิติการมาสาย",
              weight: "bold",
              size: "sm",
              color: "#c2410c",
            },
            {
              type: "text",
              text: `${stats.totalLateMinutes} นาที`,
              weight: "bold",
              size: "sm",
              color: "#c2410c",
              align: "end",
            },
          ],
        },
        {
          type: "text",
          text: `จำนวน ${stats.totalLateCount} ครั้ง`,
          size: "xs",
          color: "#f97316",
          margin: "xs",
        },
      ],
    });
  }

  // Leave Breakdown
  if (
    hasLeave &&
    stats.leaveDetails &&
    Object.keys(stats.leaveDetails).length > 0
  ) {
    const leaveRows = Object.entries(stats.leaveDetails).map(
      ([type, count]) => ({
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: `• ${type}`,
            size: "sm",
            color: "#4b5563",
            flex: 3,
          },
          {
            type: "text",
            text: `${count} วัน`,
            size: "sm",
            color: "#4b5563",
            flex: 1,
            align: "end",
          },
        ],
        margin: "sm",
      })
    );

    breakdownSection.push({
      type: "box",
      layout: "vertical",
      backgroundColor: "#f0fdf4", // Green 50
      cornerRadius: "md",
      paddingAll: "md",
      margin: "md",
      contents: [
        {
          type: "text",
          text: "📋 รายละเอียดการลา",
          weight: "bold",
          size: "sm",
          color: "#15803d",
        },
        { type: "separator", margin: "md", color: "#bbf7d0" },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          contents: leaveRows,
        },
      ],
    });
  }

  // Absent Alert
  if (hasAbsent) {
    breakdownSection.push({
      type: "box",
      layout: "vertical",
      backgroundColor: "#fef2f2", // Red 50
      cornerRadius: "md",
      paddingAll: "md",
      margin: "md",
      contents: [
        {
          type: "text",
          text: "❌ มีวันขาดงาน/ลืมลงเวลา",
          weight: "bold",
          size: "sm",
          color: "#dc2626",
          align: "center",
        },
        {
          type: "text",
          text: `จำนวน ${stats.totalAbsent} วัน กรุณาติดต่อ HR หรือหัวหน้างาน`,
          size: "xs",
          color: "#ef4444",
          align: "center",
          wrap: true,
          margin: "sm",
        },
      ],
    });
  }

  // 3. Perfect Attendance Badge
  const heroBadge =
    !hasLate && !hasAbsent && !hasLeave
      ? {
          type: "box",
          layout: "vertical",
          backgroundColor: "#dcfce7", // Green 100
          cornerRadius: "full",
          paddingStart: "md",
          paddingEnd: "md",
          paddingTop: "xs",
          paddingBottom: "xs",
          contents: [
            {
              type: "text",
              text: "🏆 Perfect Attendance",
              size: "xs",
              color: "#166534",
              weight: "bold",
              align: "center",
            },
          ],
          margin: "md",
        }
      : null;

  // 4. Daily Rows (Typography-based)
  const rows = dailyStatuses.map((day) => {
    // Styling based on status
    let rowColor = "#334155";
    let statusWeight = "regular";
    let bgColor = null; // Transparent by default

    if (day.status.includes("สาย")) {
      rowColor = "#c2410c"; // Orange
      statusWeight = "bold";
    } else if (day.status.includes("ลา") && !day.status.includes("มาทำงาน")) {
      // "Leave" matches but if "Worked (Leave 2 hrs)" -> maybe Work color?
      // Assuming "ลา" usually means full day leave unless combined with work status.
      // But my new logic appends "(Leave ...)" to work status.
      // So if status is "มาทำงาน ... (ลา ...)"
      // If late, it's orange. If not late but leaves early?
      // If "Worked", it enters here if "ลา" is present?
      // "มาทำงาน (ลา...)" -> Hits "ลา".
      // I should allow "มาทำงาน" to color it Green if not Late?
      // But "Leave" usually implies Yellow.
      // Let's refine:
      rowColor = "#ca8a04"; // Yellow
    } else if (day.status.includes("ขาด") || day.status.includes("ลืม")) {
      rowColor = "#dc2626"; // Red
      statusWeight = "bold";
      bgColor = "#fef2f2"; // Light Red Bg
    } else if (day.status.includes("มาทำงาน")) {
      rowColor = "#059669"; // Green
      // Covers "วันหยุด (มาทำงาน)" and normal "มาทำงาน"
    } else if (
      day.status.includes("หยุด") ||
      day.status.includes("ชดเชย") ||
      day.isHoliday
    ) {
      rowColor = "#94a3b8"; // Muted Gray
    } else if (day.status === "-") {
      rowColor = "#cbd5e1"; // Very light gray
    }

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: day.date.substring(0, 5), // dd/mm
          size: "sm",
          color: "#94a3b8", // Slate 400
          flex: 0,
          weight: "regular",
          align: "start",
        },
        {
          type: "text",
          text: day.status,
          size: "sm",
          color: rowColor,
          flex: 1,
          wrap: true,
          align: "end", // Right aligned status
          weight: statusWeight,
        },
      ],
      paddingAll: bgColor ? "sm" : "none",
      cornerRadius: bgColor ? "sm" : "none",
      backgroundColor: bgColor || "#00000000",
      margin: "sm",
      alignItems: "center",
    };
  });

  // --- Construct Body ----
  const bodyContents = [
    // 1. Employee Header Section
    ...(heroBadge ? [heroBadge] : []),
    {
      type: "text",
      text: employeeName,
      weight: "bold",
      size: "lg",
      align: "center",
      color: "#1e293b",
      margin: "md",
    },
    { type: "separator", margin: "lg", color: "#f1f5f9" },

    // 2. Main Stats
    // Row 1: Work & OT
    {
      type: "box",
      layout: "horizontal",
      spacing: "md",
      paddingTop: "md",
      paddingBottom: "sm",
      contents: [
        statBox("วันทำงาน", stats.totalWorkDays, "#3b82f6"),
        { type: "separator", color: "#f1f5f9" },
        statBox(
          "OT (ชม.)",
          stats.totalOTHours || 0,
          stats.totalOTHours > 0 ? "#10b981" : "#cbd5e1"
        ),
      ],
    },
    // Row 2: Leave & Absent
    {
      type: "box",
      layout: "horizontal",
      spacing: "md",
      paddingTop: "sm",
      paddingBottom: "lg",
      contents: [
        statBox("วันลา", stats.totalLeaves, hasLeave ? "#f59e0b" : "#cbd5e1"),
        { type: "separator", color: "#f1f5f9" },
        statBox(
          "วันขาด",
          stats.totalAbsent,
          hasAbsent ? "#ef4444" : "#cbd5e1",
          hasAbsent
        ),
      ],
    },
    // { type: "separator", margin: "md", color: "#f1f5f9" },

    // 3. Breakdowns
    ...breakdownSection,

    // 4. Swap Info
    ...(hasSwap
      ? [
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            paddingStart: "lg",
            paddingEnd: "lg",
            contents: [
              {
                type: "text",
                text: "🔄 วันหยุดชดเชย",
                size: "sm",
                color: "#10b981",
                flex: 3,
              },
              {
                type: "text",
                text: `${stats.swapCount} วัน`,
                size: "sm",
                color: "#333333",
                flex: 1,
                align: "end",
                weight: "bold",
              },
            ],
          },
        ]
      : []),

    // 5. Daily List Header
    {
      type: "text",
      text: "รายการประจำวัน",
      weight: "bold",
      size: "md",
      color: "#334155",
      margin: "xl",
    },
    { type: "separator", margin: "md", color: "#e2e8f0" },

    // 6. Daily List Rows
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "xs",
      contents:
        rows.length > 0
          ? rows
          : [
              {
                type: "text",
                text: "ยังไม่มีข้อมูล",
                size: "sm",
                color: "#94a3b8",
                align: "center",
                margin: "lg",
              },
            ],
    },
  ];

  // Use buildBubble for consistent layout
  const bubble = buildBubble({
    title: "สรุปการทำงาน",
    subTitle: { text: period, color: "#64748b" },
    contents: bodyContents,
    footerText: "Time Now - Smart Attendance System",
  });

  return {
    type: "flex",
    altText: `รายงานการทำงานเดือน ${period}`,
    contents: bubble,
  };
};

module.exports = { createReportFlex };
