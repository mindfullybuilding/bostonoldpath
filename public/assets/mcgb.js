const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
// Browsers can blur a control before a breakpoint event fires. Remember its origin
// so focus can move to the equivalent visible control after reflow.
let focusOrigin = document.activeElement;
document.addEventListener("focusin", (e) => {
  focusOrigin = e.target;
});
document.addEventListener("pointerdown", (e) => {
  focusOrigin = e.target;
});
const focusBeforeReflow = () =>
  document.activeElement === document.body ? focusOrigin : document.activeElement;
const drawer = $("#mobile-menu");
let drawerOpener;
$("[data-open-drawer]")?.addEventListener("click", (e) => {
  drawerOpener = e.currentTarget;
  drawer.showModal();
  document.documentElement.classList.add("dialog-open");
});
$$("[data-close-dialog]").forEach((b) =>
  b.addEventListener("click", () => b.closest("dialog").close()),
);
drawer?.addEventListener("close", () => {
  document.documentElement.classList.remove("dialog-open");
  if (drawerOpener && getComputedStyle(drawerOpener).display !== "none") drawerOpener.focus();
});
drawer?.addEventListener("click", (e) => {
  if (e.target.closest("a")) drawer.close();
});
drawer?.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const items = $$("a[href],button:not([disabled])", drawer).filter(
    (el) => el.getClientRects().length,
  );
  const first = items[0],
    last = items.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});
const desktop = matchMedia("(min-width:1200px)");
desktop.addEventListener("change", (e) => {
  if (e.matches) {
    const focusWasInCompactNav = drawer?.open || focusBeforeReflow() === $("[data-open-drawer]");
    if (drawer?.open) drawer.close();
    if (focusWasInCompactNav) $(".brand")?.focus();
  } else {
    const focusWasInDesktopNav = focusBeforeReflow()?.closest(".desktop-nav");
    if (focusWasInDesktopNav) $("[data-open-drawer]")?.focus();
  }
});
function openHash() {
  let el;
  try {
    el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return;
  }
  if (!el) return;
  let p = el;
  while (p) {
    if (p.tagName === "DETAILS") p.open = true;
    p = p.parentElement;
  }
  requestAnimationFrame(() => el.scrollIntoView());
}
addEventListener("hashchange", openHash);
if (location.hash) openHash();
const calendarDisclosure = $(".calendar-disclosure");
if (calendarDisclosure) calendarDisclosure.open = false;

$$("[data-copy]").forEach((button) =>
  button.addEventListener("click", async () => {
    const input = document.getElementById(button.dataset.copy),
      status = $(".copy-status");
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = "Calendar URL copied.";
    } catch {
      input.focus();
      input.select();
      status.textContent =
        "Copy is unavailable. The URL is selected; use your device’s Copy command.";
    }
  }),
);
const filters = $("#group-filters");
if (filters) {
  let data;
  const load = () =>
    (data ??= fetch("/assets/site-data.json").then((r) => {
      if (!r.ok) throw new Error("Directory data");
      return r.json();
    }));
  const toggle = $("[data-filter-toggle]");
  matchMedia("(max-width:899px)").addEventListener("change", (e) => {
    if (
      e.matches &&
      !filters.classList.contains("is-open") &&
      filters.contains(focusBeforeReflow())
    )
      toggle?.focus();
    if (!e.matches && focusBeforeReflow() === toggle) $("#group-search").focus();
  });
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Hide filters" : "Filter groups";
    filters.classList.toggle("is-open", open);
    if (open) $("#group-search").focus();
  });
  let version = 0;
  async function filter() {
    const own = ++version;
    try {
      const { sanghas } = await load();
      if (own !== version) return;
      const f = new FormData(filters),
        search = String(f.get("search") || "")
          .toLowerCase()
          .trim();
      let count = 0;
      for (const s of sanghas) {
        const match =
          (!search ||
            `${s.name} ${s.location} ${s.address || ""} ${s.description}`
              .toLowerCase()
              .includes(search)) &&
          ["modality", "day", "timeBand"].every((key) => {
            const values = f.getAll(key);
            return (
              !values.length ||
              values.some((v) => (key === "day" ? s.days.includes(v) : s[key] === v))
            );
          });
        $(`[data-group="${s.id}"]`).hidden = !match;
        if (match) count++;
      }
      $("#group-count").textContent = `${count} ${count === 1 ? "sangha" : "sanghas"}`;
      $("#no-groups").hidden = count !== 0;
    } catch {
      $("#group-count").textContent = "Filters are unavailable. All groups are shown below.";
    }
  }
  filters.addEventListener("input", filter);
  filters.addEventListener("reset", () => setTimeout(filter, 0));
  $("[data-clear-filters]")?.addEventListener("click", () => {
    filters.reset();
    $("#group-search").focus();
  });
}
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});
function eventTime(event) {
  if (event.allDay) {
    const date = new Date(`${event.start}T12:00:00Z`);
    const end = new Date(`${event.end}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() - 1);
    return dateFmt.format(date) + (end > date ? ` – ${dateFmt.format(end)}` : "") + " · All day";
  }
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const endDate =
    end && dateFmt.format(end) !== dateFmt.format(start) ? dateFmt.format(end) + " · " : "";
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}${end ? " – " + endDate + timeFmt.format(end) : ""}`;
}
for (const root of $$("[data-agenda]")) {
  let events = [],
    shown = Number(root.dataset.limit),
    hasLoaded = false;
  const list = $(".agenda-list", root),
    status = $(".agenda-status", root),
    more = $("[data-more]", root),
    retry = $("[data-retry]", root);
  function render() {
    list.replaceChildren();
    for (const event of events.slice(0, shown)) {
      const article = document.createElement("article");
      article.className = "agenda-item";
      const h = document.createElement("h3");
      h.textContent = event.title;
      const when = document.createElement("p");
      when.textContent = eventTime(event);
      article.append(h, when);
      if (event.location) {
        const p = document.createElement("p");
        p.textContent = event.location;
        article.append(p);
      }
      if (event.description) {
        const d = document.createElement("details"),
          s = document.createElement("summary"),
          p = document.createElement("p");
        s.textContent = "Event details";
        p.textContent = event.description;
        d.append(s, p);
        article.append(d);
      }
      if (event.url) {
        try {
          const u = new URL(event.url);
          if (["https:", "http:"].includes(u.protocol)) {
            const a = document.createElement("a");
            a.href = u.href;
            a.textContent = "Event source";
            article.append(a);
          }
        } catch {
          /* Missing source links do not block the agenda. */
        }
      }
      list.append(article);
    }
    more.hidden = events.length <= shown;
  }
  async function load() {
    retry.disabled = true;
    retry.textContent = "Refreshing…";
    try {
      const r = await fetch("/api/events", { signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error("Calendar unavailable");
      const data = await r.json();
      events = data.events;
      hasLoaded = true;
      render();
      status.textContent = events.length
        ? `${events.length} upcoming ${events.length === 1 ? "event" : "events"}. Updated ${timeFmt.format(new Date(data.retrievedAt))}.`
        : "No upcoming community events are currently listed.";
    } catch {
      status.textContent = hasLoaded
        ? "The calendar could not refresh. Previously loaded events remain below; retry or use Google Calendar and the subscription guide."
        : "Upcoming events are temporarily unavailable. Retry, open Google Calendar, or use the subscription guide.";
    } finally {
      retry.disabled = false;
      retry.textContent = "Refresh events";
    }
  }
  retry.addEventListener("click", load);
  more.addEventListener("click", () => {
    shown += 10;
    render();
  });
  load();
}
// Keep anchored sections and focused controls clear of the content-driven header.
const siteHeader = document.querySelector(".site-header");
if (siteHeader && "ResizeObserver" in window)
  new ResizeObserver(([entry]) =>
    document.documentElement.style.setProperty(
      "--sticky-offset",
      `${entry.target.getBoundingClientRect().height + 24}px`,
    ),
  ).observe(siteHeader);
