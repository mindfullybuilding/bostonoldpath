import { calendarDateKey, monthModel, monthTable } from "./calendar-view.js";
import { dailySanghas, dailyMarkup, directoryDate } from "./sangha-schedule.js";
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
// Arrow-free website navigation disclosures; ordinary links retain native semantics.
const navDisclosures = $$(".nav-disclosure");
function setNav(group, open) {
  const trigger = $(".nav-trigger", group);
  trigger.setAttribute("aria-expanded", String(open));
  document.getElementById(trigger.getAttribute("aria-controls")).hidden = !open;
}
function closeNav(except) {
  navDisclosures.forEach((group) => {
    if (group !== except) setNav(group, false);
  });
}
navDisclosures.forEach((group) => {
  const trigger = $(".nav-trigger", group);
  const panel = $(".nav-panel", group);
  if ($('a[aria-current="page"]', panel)) trigger.dataset.current = "true";
  let restoringFocus = false;
  trigger.addEventListener("focus", () => {
    if (restoringFocus) return;
    closeNav(group);
    setNav(group, true);
  });
  group.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" || !matchMedia("(hover:hover) and (pointer:fine)").matches)
      return;
    if (trigger.getAttribute("aria-expanded") !== "true") {
      closeNav(group);
      setNav(group, true);
    }
  });
  group.addEventListener("pointerleave", () => {
    if (!group.contains(document.activeElement)) setNav(group, false);
  });
  group.addEventListener("focusout", (e) => {
    const next = e.relatedTarget;
    setTimeout(() => {
      // WebKit on macOS can blur a navigation control before focusing a clicked link.
      // Keep the pointer's panel alive until that click has completed.
      if (!group.contains(document.activeElement) && (next || !group.matches(":hover")))
        setNav(group, false);
    }, 0);
  });
  group.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      restoringFocus = true;
      setNav(group, false);
      trigger.focus();
      restoringFocus = false;
    }
    if (e.key === "ArrowDown" && e.target === trigger) {
      e.preventDefault();
      closeNav(group);
      setNav(group, true);
      $("a", panel).focus();
    }
  });
});
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest(".nav-disclosure")) closeNav();
});
$$(".drawer-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const open = trigger.getAttribute("aria-expanded") !== "true";
    trigger.setAttribute("aria-expanded", String(open));
    document.getElementById(trigger.getAttribute("aria-controls")).hidden = !open;
  });
});
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
  closeNav();
  if (e.matches) {
    const focusWasInCompactNav = drawer?.open || focusBeforeReflow() === $("[data-open-drawer]");
    if (drawer?.open) drawer.close();
    if (focusWasInCompactNav) ($(".brand") || $(".desktop-nav a"))?.focus();
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
function routeHash() {
  if (location.pathname.endsWith("find-a-sangha.html") && location.hash === "#subscribe-calendar")
    location.replace("/subscribe-calendar.html");
  else if (location.hash) openHash();
}
addEventListener("hashchange", routeHash);
routeHash();
const calendarDisclosure = $(".calendar-disclosure");
if (calendarDisclosure) calendarDisclosure.open = false;

$$("[data-copy]").forEach((button) =>
  button.addEventListener("click", async () => {
    const input = document.getElementById(button.dataset.copy),
      status = button.dataset.status
        ? document.getElementById(button.dataset.status)
        : $(".copy-status");
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = button.dataset.copy.startsWith("mail-")
        ? "Email address copied."
        : "Calendar URL copied.";
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
  const sortSelect = $("[data-sort-sanghas]");
  const groupList = $(".group-list");
  const cards = $$("[data-group]", groupList);
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  sortSelect.closest(".sangha-sort").hidden = false;
  sortSelect.addEventListener("change", () => {
    cards.sort((a, b) => {
      const nameOrder = $("h2", a).textContent.localeCompare($("h2", b).textContent, "en");
      if (sortSelect.value === "day")
        return (
          weekdays.indexOf(a.dataset.sortDay) - weekdays.indexOf(b.dataset.sortDay) || nameOrder
        );
      return nameOrder * (sortSelect.value === "name-desc" ? -1 : 1);
    });
    groupList.append(...cards);
    $("[data-sort-status]").textContent = {
      "name-asc": "Sorted by Sangha Name, A to Z.",
      "name-desc": "Sorted by Sangha Name, Z to A.",
      day: "Sorted by Day of the Week, Sunday to Saturday.",
    }[sortSelect.value];
  });
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
    toggle.setAttribute("aria-label", open ? "Hide filters" : "Filter groups");
    filters.classList.toggle("is-open", open);
    if (open) $("#group-search").focus();
  });
  const closeFilters = () => {
    filters.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Filter groups");
    toggle.focus();
  };
  $("[data-close-filters]")?.addEventListener("click", closeFilters);
  filters.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && matchMedia("(max-width:899px)").matches) closeFilters();
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
      $("#group-count").textContent = `${count} of ${sanghas.length} Sanghas`;
      $("#no-groups").hidden = count !== 0;
    } catch {
      $("#group-count").textContent = "Filters are unavailable. All groups are shown below.";
    }
  }
  filters.addEventListener("input", filter);
  filters.addEventListener("reset", () => setTimeout(filter, 0));
  $("[data-clear-filters]")?.addEventListener("click", () => {
    filters.reset();
    if (matchMedia("(max-width:899px)").matches && !filters.classList.contains("is-open"))
      toggle.focus();
    else $("#group-search").focus();
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
    hasLoaded = false,
    lastError = false,
    monthOffset = 0;
  const list = $(".agenda-list", root),
    status = $(".agenda-status", root),
    more = $("[data-more]", root),
    retry = $("[data-retry]", root);
  const calendar = root.hasAttribute("data-month-calendar");
  const today = calendarDateKey(new Date());
  const [year, month] = today.split("-").map(Number);
  const rangeEnd = calendarDateKey(Date.now() + 180 * 86400000)
    .split("-")
    .map(Number);
  const maxOffset = (rangeEnd[0] - year) * 12 + rangeEnd[1] - month;
  function render() {
    const model = monthModel(year, month - 1 + monthOffset, events, today);
    const visible = calendar ? model.events : events;
    if (calendar) {
      $("[data-month-label]", root).textContent = model.label;
      $("[data-month-grid]", root).innerHTML = monthTable(model);
      $("[data-month-prev]", root).disabled = monthOffset <= 0;
      $("[data-month-next]", root).disabled = monthOffset >= maxOffset;
    }
    list.replaceChildren();
    for (const event of visible.slice(0, shown)) {
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
    more.hidden = visible.length <= shown;
    if (hasLoaded && !lastError)
      status.textContent = visible.length
        ? `${visible.length} ${calendar ? "community" : "upcoming"} ${visible.length === 1 ? "event" : "events"}${calendar ? " in " + model.label : ""}.`
        : calendar
          ? `No upcoming community events listed in ${model.label}.`
          : "No upcoming community events are currently listed.";
  }
  async function load() {
    retry.disabled = true;
    retry.textContent = "Refreshing…";
    try {
      const response = await fetch("/api/events", { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Calendar unavailable");
      const data = await response.json();
      if (!Array.isArray(data.events)) throw new Error("Invalid calendar response");
      events = data.events;
      hasLoaded = true;
      lastError = false;
      render();
    } catch {
      lastError = true;
      status.textContent = hasLoaded
        ? "The calendar could not refresh. Previously loaded events remain below; retry or use the calendar subscription guide."
        : "Upcoming events are temporarily unavailable. Retry or use the calendar subscription guide.";
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
  if (calendar) {
    $("[data-month-prev]", root).addEventListener("click", () => {
      if (monthOffset > 0) monthOffset--;
      shown = Number(root.dataset.limit);
      render();
    });
    $("[data-month-next]", root).addEventListener("click", () => {
      if (monthOffset < maxOffset) monthOffset++;
      shown = Number(root.dataset.limit);
      render();
    });
    render();
  }
  load();
}
const todaySanghas = $("[data-today-sanghas]");
if (todaySanghas) {
  const status = $(".today-status");
  let groups, shownDate;
  const render = () => {
    if (!groups) return;
    const model = dailySanghas(groups);
    shownDate = model.date;
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(new Date());
    $("[data-sangha-date]").replaceChildren(
      Object.assign(document.createElement("time"), {
        dateTime: model.date,
        textContent: dateLabel,
      }),
    );
    todaySanghas.innerHTML = dailyMarkup(model);
    status.textContent = `${model.scheduled.length + model.uncertain.length} regular sanghas listed for ${dateLabel}.`;
    status.classList.add("sr-only");
  };
  status.textContent = "Loading today’s sanghas…";
  fetch("/assets/site-data.json", { signal: AbortSignal.timeout(8000) })
    .then((response) => {
      if (!response.ok) throw new Error("Directory unavailable");
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data.sanghas)) throw new Error("Invalid directory");
      groups = data.sanghas;
      render();
    })
    .catch(() => {
      status.textContent =
        "Today’s list is unavailable. Open the full sangha schedule for regular meeting times.";
    });
  const checkDate = () => {
    if (!document.hidden && directoryDate().date !== shownDate) render();
  };
  document.addEventListener("visibilitychange", checkDate);
  setInterval(checkDate, 60000);
}

// Keep anchored sections and focused controls clear of the content-driven header.
const siteHeader = document.querySelector(".site-header");
if (siteHeader && "ResizeObserver" in window)
  new ResizeObserver(([entry]) => {
    const height = entry.target.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-height", `${height}px`);
    document.documentElement.style.setProperty("--sticky-offset", `${height + 24}px`);
  }).observe(siteHeader);

const mailingChoices = $$("[data-mail-choice]");
if (mailingChoices.length) {
  const updateMailChoices = () => {
    const selected = mailingChoices.filter((el) => el.checked);
    $("#mail-selection").textContent = selected.length
      ? selected.map((el) => el.dataset.label).join(" and ") +
        " selected. Send a separate request to each selected list."
      : "No lists selected. Choose a list to see its subscription address.";
    mailingChoices.forEach((el) => {
      document.getElementById(el.getAttribute("aria-controls")).hidden = !el.checked;
    });
  };
  mailingChoices.forEach((el) => el.addEventListener("change", updateMailChoices));
  updateMailChoices();
}

const identityImage = $(".identity-calligraphy img");
if (identityImage) {
  const title = identityImage.closest("h1");
  const updateIdentity = () =>
    title.classList.toggle(
      "identity-image-ready",
      identityImage.complete && identityImage.naturalWidth > 0,
    );
  identityImage.addEventListener("load", updateIdentity);
  identityImage.addEventListener("error", updateIdentity);
  updateIdentity();
}
