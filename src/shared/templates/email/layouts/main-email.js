// src/templates/email/layouts/main-email.js
// MJML template generator for centered identity design (CommonJS)

function buildEmailMJML({
  logoUrl,
  title,
  subTitle,
  rows = [],
  footerText = "",
} = {}) {
  // Simple, responsive MJML with inline styles
  const rowHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px; color:#8c8c8c; font-size:14px;">${escapeHtml(
          r.label
        )}</td>
        <td style="padding:8px 12px; color:#111111; font-size:14px; text-align:right;">${escapeHtml(
          r.value
        )}</td>
      </tr>`
    )
    .join("\n");

  return `
  <mjml>
    <mj-body background-color="#f3f7fb">
      <mj-section padding-top="40px" padding-bottom="20px">
        <mj-column>
          <mj-image src="${escapeAttr(
            logoUrl
          )}" alt="logo" width="80px" align="center"></mj-image>
        </mj-column>
      </mj-section>

      <mj-section background-color="#ffffff" padding="20px" border-radius="12px" css-class="card" width="600px">
        <mj-column>
          <mj-text align="center" font-size="20px" font-weight="bold" color="#111111" padding-bottom="6px">${escapeHtml(
            title
          )}</mj-text>
          <mj-text align="center" font-size="14px" color="#1DB446" padding-bottom="12px">${escapeHtml(
            subTitle
          )}</mj-text>

          <mj-table>
            ${rowHtml}
          </mj-table>
        </mj-column>
      </mj-section>

      <mj-section padding-top="18px">
        <mj-column>
          <mj-text align="center" color="#8c8c8c" font-size="12px">${escapeHtml(
            footerText
          )}</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll('&', "&amp;")
    .replaceAll('<', "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&#39;");
}

function escapeAttr(s = "") {
  return String(s).replaceAll(/"/g, "&quot;");
}

module.exports = {
  buildEmailMJML,
};
