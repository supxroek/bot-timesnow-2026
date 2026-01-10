const makeFlex = (altText, contents) => ({
  type: "flex",
  altText,
  contents,
});

const beaconNotFoundFlex = () =>
  makeFlex("ไม่พบสัญญาณ Beacon", {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⚠️ ไม่พบสัญญาณ",
          weight: "bold",
          color: "#FF3333",
          size: "xl",
        },
        {
          type: "text",
          text: "กรุณาเปิด Bluetooth หรือเดินเข้าใกล้จุดลงเวลา",
          wrap: true,
          margin: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "วิธีเปิด Bluetooth",
            uri: "https://line.me",
          },
          style: "link",
        },
      ],
    },
  });

const noShiftFlex = () =>
  makeFlex("ไม่พบกะการทำงาน", {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📅 ไม่พบตารางงาน",
          weight: "bold",
          color: "#FF9900",
          size: "xl",
        },
        {
          type: "text",
          text: "ระบบไม่พบข้อมูลกะการทำงานของคุณในวันนี้ กรุณาติดต่อ HR หรือหัวหน้างาน",
          wrap: true,
          margin: "md",
        },
      ],
    },
  });

module.exports = { beaconNotFoundFlex, noShiftFlex };
