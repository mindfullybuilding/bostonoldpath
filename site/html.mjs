export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[x],
  );
export const link = (url, label, cls = "") =>
  `<a ${cls ? `class="${cls}"` : ""} href="${esc(url)}">${label}</a>`;
