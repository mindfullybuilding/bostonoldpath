import { config as c } from "../config.mjs";
import { esc, link } from "../html.mjs";
function resource(item) {
  const id = item.id ? ` id="resource-${esc(item.id)}"` : "";
  if (item.unavailable || ["become-a-mentor", "update-sangha-details"].includes(item.id)) return "";
  if (item.id === "join-builder-sangha")
    return `<a class="resource-card" id="resource-join-builder-sangha" href="mailto:${c.contactEmail}" aria-label="Community Builder Inquiries"><h3>Community Builder Inquiries</h3><p>For questions about Builder Sangha, <span id="resource-become-a-mentor">mentoring</span>, or <span id="resource-update-sangha-details">updating sangha details</span>, <span class="underlined">email MCGB</span>.</p></a>`;
  return `<a class="resource-card"${id} href="${esc(item.url)}" aria-label="${esc(item.title)}"><h3>${esc(item.title)}</h3><p>${esc(item.copy)}</p></a>`;
}

export function resourceView(resources) {
  return {
    resourceJumps: resources.map(([id, title]) => link(`#${id}`, esc(title), "button")).join(""),
    resourceGroups: resources
      .map(
        ([id, title, items]) =>
          `<section class="section resource-group" id="${id}"><h2>${esc(title)}</h2><div class="resource-grid"${id === "community-builders" ? ' id="resource-sangha-resources"' : ""}>${items.map((item) => resource(item)).join("")}</div></section>`,
      )
      .join(""),
  };
}
