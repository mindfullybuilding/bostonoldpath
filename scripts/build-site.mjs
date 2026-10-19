import fs from "node:fs/promises";
import { config as c } from "../site/config.mjs";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[x],
  );
const sanghas = JSON.parse(await fs.readFile("site/sanghas.json", "utf8"));
const resources = JSON.parse(await fs.readFile("site/resources.json", "utf8"));
const link = (url, label, cls = "") =>
  `<a ${cls ? `class="${cls}"` : ""} href="${esc(url)}">${label}</a>`;
const form = link(c.communityVoicesFormUrl, "Submit your contribution", "button primary");
const group = link("/find-a-sangha.html", "Find a group", "button primary");
const menu = `<a href="/new-here.html">New here</a><a href="/find-a-sangha.html#calendar">Events</a><div class="nav-disclosure"><button aria-expanded="false" aria-controls="resources-menu">Resources <span aria-hidden="true">⌄</span></button><div class="nav-panel" id="resources-menu" hidden><a href="/resources.html">All resources</a><a href="/our-practice.html">Our practice</a><a href="/resources.html#community-builders">For community builders</a></div></div><div class="nav-disclosure"><button aria-expanded="false" aria-controls="community-menu">Our community <span aria-hidden="true">⌄</span></button><div class="nav-panel" id="community-menu" hidden><a href="/our-community.html">Community overview</a><a href="/community-voices.html">Community Voices</a><a href="/newsletters.html">Newsletter archive</a></div></div><a href="/join-mailing-list.html">Mailing list</a>`;
const header = `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner container"><a class="brand" href="/" aria-label="Mindfulness Communities of Greater Boston — home"><span class="full-brand">Mindfulness Communities<br>of Greater Boston</span><span class="compact-brand">MCGB</span></a><nav class="desktop-nav" aria-label="Main">${menu}</nav><div class="header-actions">${group}<button class="menu-trigger" data-open-drawer aria-haspopup="dialog" aria-controls="mobile-menu" aria-label="Open menu"><span aria-hidden="true">☰</span></button></div></div></header><dialog class="drawer" id="mobile-menu" aria-labelledby="drawer-title"><div class="drawer-top"><h2 id="drawer-title">Explore MCGB</h2><button data-close-dialog aria-label="Close menu">Close</button></div><nav aria-label="Mobile main"><a href="/new-here.html">New here</a><a href="/find-a-sangha.html#calendar">Events</a><a href="/resources.html">Resources</a><a class="drawer-sub" href="/our-practice.html">Our practice</a><a class="drawer-sub" href="/resources.html#community-builders">For community builders</a><a href="/our-community.html">Our community</a><a class="drawer-sub" href="/community-voices.html">Community Voices</a><a class="drawer-sub" href="/newsletters.html">Newsletter archive</a><a href="/join-mailing-list.html">Mailing list</a><a href="/find-a-sangha.html">Find a group</a></nav></dialog>`;
const footer = `<footer class="site-footer"><div class="container"><div class="footer-grid"><div><h2>Mindfulness Communities<br>of Greater Boston</h2><p>Engaged Buddhism in the Plum Village tradition of Thích Nhất Hạnh.</p></div><div><h3>Practice together</h3><div class="footer-links"><a href="/find-a-sangha.html">Find a group</a><a href="/find-a-sangha.html#calendar">Community events</a><a href="/community-voices.html">Community Voices</a><a href="/join-mailing-list.html">Join our mailing lists</a></div></div><div><h3>Stay connected</h3><div class="footer-links"><a href="mailto:${c.contactEmail}">Contact MCGB</a><a href="/newsletters.html">Newsletter archive</a><a href="/accessibility.html">Accessibility</a><a href="/photo-credits.html">Photo credits</a><a href="/privacy.html">Privacy &amp; site information</a></div></div></div><div class="footer-bottom">A regional community of practice. Each group maintains its own arrangements.</div></div></footer>`;
const page = async (
  file,
  title,
  body,
  description = "Mindfulness, community, and practice in Greater Boston in the Plum Village tradition.",
) =>
  fs.writeFile(
    `public/${file}.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#dfbc1e">${file === "home" ? '<link rel="preload" as="image" href="/assets/beginners-mind-page-title-hero.jpg" fetchpriority="high">' : ""}<title>${esc(title)} | MCGB</title><link rel="canonical" href="${c.origin}${file === "home" ? "/" : `/${file}.html`}"><link rel="stylesheet" href="/assets/mcgb.css"><script type="module" src="/assets/mcgb.js"></script></head><body>${header.replaceAll(`href="/${file === "home" ? "" : file + ".html"}"`, `href="/${file === "home" ? "" : file + ".html"}" aria-current="page"`)}<noscript><nav class="container no-script-nav" aria-label="Site destinations"><a href="/new-here.html">New here</a><a href="/find-a-sangha.html">Groups &amp; events</a><a href="/resources.html">Resources</a><a href="/our-community.html">Our community</a><a href="/join-mailing-list.html">Mailing lists</a></nav></noscript><main id="main" tabindex="-1">${body}</main>${footer}</body></html>`,
  );
const intro = (eyebrow, title, copy) =>
  `<section class="section container"><div class="reading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lede">${copy}</p></div></section>`;
const card = (n, title, copy, url, label) =>
  `<article class="card">${n ? `<span class="number" aria-hidden="true">${n}</span>` : ""}<h3>${title}</h3><p>${copy}</p>${link(url, label)}</article>`;
const agenda = (limit = 10) =>
  `<div data-agenda data-limit="${limit}"><p class="calendar-label">Times shown in America/New_York (Eastern time).</p><p class="agenda-status" role="status">Loading upcoming events…</p><div class="agenda-list"></div><div class="agenda-controls"><button data-retry>Refresh events</button><button data-more hidden>Show more events</button></div><noscript><p>The live agenda needs JavaScript. ${link(c.googleCalendarEmbedUrl, "Open Google Calendar")} or use the <a href="/find-a-sangha.html#subscribe-calendar">calendar subscription guide</a>.</p></noscript></div>`;
await page(
  "home",
  "A deep bow to you, dear friend",
  `<section class="hero"><div class="hero-content container"><h1>A deep bow to you, dear friend.</h1><p class="lede">We are Mindfulness Communities of Greater Boston, a network of friends learning to live with awareness and care. Our practice is rooted in the Plum Village tradition of Thích Nhất Hạnh.</p><div class="actions">${group}${link("/new-here.html", "New here? Start here", "button")}</div></div></section><section class="section band"><div class="container"><div class="section-head"><p class="eyebrow">Ways to practice</p><h2>Practice groups, events, and resources</h2></div><div class="grid">${card("01", "Sit with a group", "Find a sangha — a community that practices mindfulness together — nearby or online.", "/find-a-sangha.html", "Explore our groups")}${card("02", "Gather with community", "Discover days of mindfulness, retreats, and other community gatherings.", "/find-a-sangha.html#calendar", "See community events")}${card("03", "Bring mindfulness home", "Explore breathing, walking, and ordinary moments as opportunities to return to yourself.", "/our-practice.html", "Discover our practice")}</div></div></section><section class="section container split"><figure><img src="/assets/licensed/plum-village-hall.jpg" alt="Still Water Meditation Hall among trees at Plum Village’s Upper Hamlet" width="1024" height="768" loading="lazy"><figcaption>Still Water Meditation Hall, Plum Village, France. Photo: Solipsistic19, CC BY-SA 4.0. ${link("/photo-credits.html", "Photo credits")}.</figcaption></figure><div><p class="eyebrow">A living tradition</p><h2>Our community and tradition</h2><p>We explore mindfulness in our homes, work, relationships, and society. Practicing together helps us listen deeply and meet daily life with compassion.</p>${link("/our-community.html", "Meet our community", "button")}</div></section><section class="section band"><div class="container split"><div><p class="eyebrow">Community Voices</p><h2>Community writing and art</h2><p>Poetry, stories, songs, and art can give expression to a shared life of practice. Explore our newsletter archive, or offer a contribution for community review.</p><div class="actions">${link("/community-voices.html", "Explore Community Voices", "button")}${link(c.communityVoicesFormUrl, "Submit a contribution")}</div></div><article class="callout"><p class="eyebrow">From the archive</p><h3>The Present Moment</h3><p>Read the April 2026 edition of the Newsletter of Mindfulness Communities of Greater Boston.</p>${link("/assets/April2026_Newsletter_Final.pdf", "Read April 2026 (PDF)")}<p class="small">Historical PDFs may have accessibility limitations. Contact us for help accessing a particular item.</p></article></div></section><section class="section container"><div class="section-head"><p class="eyebrow">Community calendar</p><h2>Upcoming community events</h2><p>Community events from our Groups.io calendar. Regular group schedules are in the directory.</p></div>${agenda(3)}<div class="actions">${link("/find-a-sangha.html#calendar", "Calendar & subscription guide", "button")}</div></section><section class="section band"><div class="container split"><div><p class="eyebrow">Mailing lists and resources</p><h2>Stay informed and continue learning</h2><p>Receive practice announcements, explore a teaching, or return to a familiar resource.</p><div class="actions">${link("/join-mailing-list.html", "Join our mailing lists", "button primary")}${link("/resources.html", "Explore resources")}</div></div><div class="callout"><h3>Preparing for a first visit</h3><p>You do not need to know all the words or forms before taking a first step. Our newcomer guide explains what to ask and how to find a group.</p>${link("/new-here.html", "A guide for your first visit")}</div></div></section>`,
);
await page(
  "new-here",
  "New here",
  `${intro("New here", "New to mindfulness practice?", "You may be curious about meditation, returning to practice, or looking for people to practice with. You can begin by learning about a group and contacting its organizer.")}<section class="section band"><div class="container grid">${card("01", "What is a sangha?", "Sangha means a community of practice. In our tradition, friends support one another in cultivating mindfulness, understanding, and compassion.", "/our-community.html", "About our community")}${card("02", "Choose a group", "Compare location, meeting format, and schedule. Some groups have a particular focus or community; read the details before joining.", "/find-a-sangha.html", "Find a group")}${card("03", "Ask before you arrive", "Confirm the next meeting, joining instructions, registration or cost, and any access arrangements with that group’s organizer.", "/find-a-sangha.html", "Find organizer details")}</div></section><section class="section container reading"><h2>What might a gathering include?</h2><p>Groups may practice sitting meditation, walking meditation, readings, mindful listening, and Dharma sharing — reflecting together on life and practice. The format and length vary by group.</p><h2>Ask about access and participation.</h2><p>Ask the organizer about chairs, movement, restrooms, stairs, sensory needs, online captions, or anything else that would help you participate. The directory preserves organizer-provided access information; it is not a verified accessibility survey of venues.</p><h2>A tradition of mindful living</h2><p>Our communities draw on the teachings of Thích Nhất Hạnh, a Vietnamese Buddhist monk, teacher, poet, and peace activist, and the Plum Village community. Mindfulness can accompany cooking, working, walking, and caring for others.</p><div class="actions">${group}${link("/our-practice.html", "Learn about our practice", "button")}</div></section>`,
);
await page(
  "our-community",
  "Our community",
  `${intro("Together in Greater Boston", "Mindfulness Communities of Greater Boston", "Mindfulness Communities of Greater Boston is an interfaith collective learning and practicing mindfulness in the Plum Village tradition of Thích Nhất Hạnh.")}<section class="section container split"><div><h2>Local and online groups</h2><p>Our sanghas meet across the region and online. Each has its own rhythm, organizers, and ways of gathering. The directory helps you find a place to begin.</p><p>We explore how to bring mindfulness into our lives, families, work, and society — throughout the day, as well as during meditation.</p>${group}</div><figure><img class="portrait" src="/assets/licensed/thich-nhat-hanh.jpg" alt="Thích Nhất Hạnh in brown robes, smiling" width="500" height="600" loading="lazy"><figcaption>Thích Nhất Hạnh, Paris, 2006. Photo: Duc (pixiduc), CC BY-SA 2.0. ${link("/photo-credits.html", "Photo credits")}.</figcaption></figure></section><section class="section band"><div class="container grid">${card("", "Community Voices", "Explore creative expression and share a link to your own work for review.", "/community-voices.html", "Read and contribute")}${card("", "The Present Moment", "Browse our community newsletter editions.", "/newsletters.html", "Read the archive")}${card("", "Togetherness", "Explore a separate community project for meeting friends outside scheduled practice.", "https://togethernessma.vercel.app/", "Visit Togetherness")}</div></section>`,
);
const issues = [
  ["April 2026", "April2026_Newsletter_Final.pdf", "april-2026.png"],
  ["Spring 2022", "Spring2022_Newsletter_Final.pdf", "spring-2022.png"],
  ["Winter 2022", "Winter2022_Newsletter_Final.pdf", "winter-2022.png"],
];
const issueCards = issues
  .map(
    ([name, pdf, img]) =>
      `<article class="card issue-card"><img src="/assets/newsletters/${img}" alt="" width="90" height="120" loading="lazy"><div><h3>${name}</h3>${link(`/assets/${pdf}`, "Read edition (PDF)")}</div></article>`,
  )
  .join("");
await page(
  "community-voices",
  "Community Voices",
  `${intro("Art · Writing · Song · Reflection", "Community Voices", "A place for work that grows from mindfulness and community. Our newsletter archive offers a starting point; new contributions are reviewed before publication.")}<section class="section band"><div class="container split"><div><h2>Offer your voice.</h2><p>Share a link to your art, writing, song, photograph, or other contribution, along with a title and description. The contribution form also asks about collaborators.</p><p>Please share only work you have permission to submit. A person reviews submissions; completing the form does not publish your work automatically.</p>${form}<p class="small">Opens a Google Form. This temporary form accepts links and descriptions, rather than direct file uploads.</p></div><div class="callout"><h3>Need another way to contribute?</h3><p>If the form is difficult to use, contact ${link(`mailto:${c.contactEmail}`, c.contactEmail)} to discuss a contribution or request help.</p></div></div></section><section class="section container"><h2>From The Present Moment</h2><p>Existing newsletter editions contain community writing and reflections. These are historical PDFs, with possible accessibility limitations.</p><div class="issue-grid">${issueCards}</div>${link("/newsletters.html", "About the newsletter archive")}</section>`,
);
await page(
  "newsletters",
  "Newsletter archive",
  `${intro("The Present Moment", "Our newsletter archive.", "The Newsletter of Mindfulness Communities of Greater Boston brings together community updates, reflections, and practice.")}<section class="section container"><div class="issue-grid">${issueCards}</div><div class="callout"><h2>Accessing historical editions</h2><p>These PDFs are retained in their original form and have not been comprehensively remediated for accessibility. For help with a particular article or edition, email ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p></div><div class="actions">${link("/join-mailing-list.html", "Join our mailing lists", "button primary")}${link("/community-voices.html", "Contribute to Community Voices", "button")}</div></section>`,
);
function resource(item) {
  const id = item.id ? ` id="resource-${esc(item.id)}"` : "";
  if (item.subtiles)
    return `<details class="resource-detail"${id}><summary>${esc(item.title)}</summary><p>${esc(item.copy)}</p><div class="resource-grid">${item.subtiles.map(resource).join("")}</div></details>`;
  return `<article class="resource-card"${id}><h3>${item.url ? link(item.url, esc(item.title)) : esc(item.title)}</h3><p>${esc(item.copy)}</p>${item.unavailable ? '<p class="small muted">This resource is not yet available.</p>' : ""}${item.relatedUrl ? link(item.relatedUrl, "Related resource") : ""}</article>`;
}
await page(
  "resources",
  "Resources",
  `${intro("Resources", "Resources for a mindful life.", "Teachings, practices, songs, and guidance for individuals and communities. ")}<div class="container"><nav class="resource-jumps" aria-label="Resource categories">${resources.map(([id, title]) => link(`#${id}`, esc(title))).join("")}</nav>${resources.map(([id, title, items]) => `<section class="section resource-group" id="${id}"><h2>${esc(title)}</h2><div class="resource-grid">${items.map(resource).join("")}</div></section>`).join("")}</div>`,
);
for (const file of [
  "our-practice",
  "sangha-overview",
  "sangha-facilitation",
  "minding-the-bell",
  "meeting-and-bell-minding-flow",
  "dharma-sharing-guidelines",
]) {
  let body = await fs.readFile(`site/content/${file}.html`, "utf8");
  body = body.replace(
    "The source teaching frames mindfulness as awake, present-moment\n              awareness. This page translates that practice into a welcoming\n              path:",
    "Mindfulness is awake, present-moment awareness. Explore a path of practice:",
  );
  await page(
    file,
    file
      .split("-")
      .map((x) => x[0].toUpperCase() + x.slice(1))
      .join(" "),
    `<div class="section container">${body}</div>`,
  );
}
const filters = [
  [
    "modality",
    "Meeting format",
    [
      ["in-person", "In person"],
      ["hybrid", "Hybrid"],
      ["virtual", "Online"],
    ],
  ],
  [
    "day",
    "Day",
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((x) => [
      x,
      x[0].toUpperCase() + x.slice(1),
    ]),
  ],
  [
    "timeBand",
    "Time of day",
    [
      ["morning", "Morning"],
      ["afternoon", "Afternoon"],
      ["evening", "Evening"],
    ],
  ],
];
const groupsHTML = sanghas
  .map((s) => {
    const contact = /email[12]@gmail/.test(s.registerUrl)
      ? `mailto:${c.contactEmail}`
      : s.registerUrl;
    return `<article class="group-card" id="${s.id}" data-group="${s.id}"><span class="format">${s.modality === "virtual" ? "Online" : s.modality === "hybrid" ? "Hybrid" : "In person"}</span><h2>${esc(s.name)}</h2><p>${esc(s.location)}<br>${esc(s.day)} · ${esc(s.time)}</p><details><summary>Group details &amp; contact</summary><p>${esc(s.description)}</p><dl class="metadata">${s.address ? `<dt>Location</dt><dd>${esc(s.address)}</dd>` : ""}<dt>Joining &amp; access</dt><dd>${esc(s.access)}</dd></dl><p>Confirm current meeting details and access needs with the organizer.</p>${link(contact, /email[12]@gmail/.test(s.registerUrl) ? "Ask MCGB for organizer contact" : s.registerUrl.startsWith("mailto:") ? "Email the organizer" : "Visit the organizer’s website", "button")}${s.registerUrl.startsWith("mailto:") && !/email[12]@gmail/.test(s.registerUrl) ? `<p class="small email-address">${esc(decodeURIComponent(s.registerUrl.slice(7)).replace("?cc=", ", "))}</p>` : ""}</details></article>`;
  })
  .join("");
const help = {
  apple: "https://support.apple.com/en-us/102301",
  google: "https://support.google.com/calendar/answer/37100?hl=en",
  microsoft:
    "https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web",
  yahoo: "https://help.yahoo.com/kb/account/unfollow-calendars-yahoo-mail-sln36693.html",
  proton: "https://proton.me/support/subscribe-to-external-calendar",
};
const guide = (name, key, steps, remove) =>
  `<details><summary>${name}</summary><ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol><p><strong>To remove:</strong> ${remove}</p>${help[key] ? link(help[key], `${name} official help`) : ""}</details>`;
const tutorials =
  guide(
    "Apple Calendar",
    "apple",
    [
      "On iPhone or iPad: open Calendar, tap Calendars → Add Calendar → Add Subscription Calendar. On Mac: open Calendar → File → New Calendar Subscription.",
      "Paste the subscription URL shown above, then confirm the subscription. On Mac, choose your refresh interval and account as offered.",
      "Alternatively, try the Apple subscription link below; if your device does not open it, copy and paste the URL manually.",
    ],
    "On iPhone/iPad, open Calendars, tap the information button next to this calendar, then Unsubscribe. On Mac, select the calendar and choose Edit → Delete.",
  ) +
  guide(
    "Google Calendar",
    "google",
    [
      "On a computer browser, open Google Calendar. Beside Other calendars, select + → From URL.",
      "Paste the subscription URL above and select Add calendar.",
      "Use the same Google account in the mobile app and enable the added calendar in its calendar list. Adding by URL is done in the web interface.",
    ],
    "In Google Calendar settings, choose this calendar under Settings for other calendars, then Remove calendar → Unsubscribe.",
  ) +
  guide(
    "Microsoft Outlook",
    "microsoft",
    [
      "Open Outlook.com or Microsoft 365 Outlook in a web browser and go to Calendar.",
      "Select Add calendar → Subscribe from web.",
      "Paste the subscription URL, give the calendar a name, and import/save the subscription.",
    ],
    "In the calendar list, open the calendar’s options and choose Remove or Delete. This removes your subscription, not community events.",
  ) +
  guide(
    "Yahoo Calendar",
    "yahoo",
    [
      "Open Yahoo Calendar in a web browser.",
      "Beside Others, use the options menu and choose Follow Other Calendars.",
      "Enter a calendar name and paste the ICS subscription URL above, then continue/save.",
    ],
    "Open the options for this calendar under Others, then select Unfollow.",
  ) +
  guide(
    "Proton Calendar",
    "proton",
    [
      "Open Proton Calendar in a web browser. This is a Calendar feature, rather than a Proton Mail subscription.",
      "Beside My calendars, select + → Add calendar from URL (or use Settings → All settings → Calendars).",
      "Paste the subscription URL above and follow the prompts to add the calendar.",
    ],
    "Go to Settings → All settings → Calendars → Other calendars. Open this calendar’s settings, scroll to Remove calendar, and select Unsubscribe.",
  ) +
  guide(
    "Other calendar apps",
    "other",
    [
      "Find an option called Subscribe by URL, Add calendar from URL, or Internet calendar.",
      "Paste the subscription URL above and confirm. Choose a name such as MCGB community events.",
      "Use a subscription to receive later changes. Importing an .ics file once usually creates a static copy.",
    ],
    "Use the app’s calendar settings to remove or unsubscribe from this calendar.",
  );
await page(
  "find-a-sangha",
  "Find a sangha",
  `${intro("Practice & community", "Find a group.", "Explore Greater Boston sanghas and online practice. Meeting times are local to Greater Boston. Confirm current arrangements with the organizer before attending.")}<section class="container" aria-label="Group directory"><div class="actions"><a href="#calendar" class="button">Community events &amp; calendar</a><button class="filter-trigger" data-filter-toggle aria-expanded="false" aria-controls="group-filters">Filter groups</button></div><div class="finder-layout"><form class="filters" id="group-filters" aria-label="Filter groups"><label for="group-search">Search name or place</label><input type="search" id="group-search" name="search" placeholder="e.g. Brookline"><div class="filter-sheet">${filters.map(([key, title, opts]) => `<fieldset><legend>${title}</legend>${opts.map(([value, label]) => `<label><input type="checkbox" name="${key}" value="${value}"> ${label}</label>`).join("")}</fieldset>`).join("")}<button type="reset">Clear filters</button></div></form><div><div class="results-top"><p id="group-count" role="status">13 groups</p><p class="small">Select “Group details &amp; contact” to learn more.</p></div><div class="group-list">${groupsHTML}</div><div id="no-groups" class="status-box" hidden><h2>No matching groups</h2><p>Try fewer filters or a different place.</p><button data-clear-filters>Clear filters</button></div></div></div><details class="region-map"><summary>View a supplementary regional map</summary><p>This map is a regional overview and is not changed by directory filters. Use the directory for schedules and contacts.</p><iframe loading="lazy" title="Supplementary map of regional sanghas" src="https://www.google.com/maps/d/embed?mid=1TBbpA9rWK7PatKg8S-NV2kAVLRAaE_c&amp;ehbc=2E312F" width="100%" height="420"></iframe><p>If the map is unavailable, all group information remains in the directory above.</p></details></section><section class="section band" id="calendar"><div class="container"><div class="section-head"><p class="eyebrow">Community events</p><h2>Community events and calendar</h2><p>Groups.io is our maintained source for community events. Regular sangha schedules are listed above. Group-directory filters do not filter this calendar.</p><div class="actions">${link("#subscribe-calendar", "Subscribe to calendar", "button primary")}${link(c.googleCalendarEmbedUrl, "Open Google Calendar")}</div></div><div class="calendar-layout">${agenda()}<details class="calendar-disclosure"><summary>Optional: Google Calendar (sign-in required)</summary><p class="small">This imported Google calendar requires Google sign-in and may require account access. The public agenda above and calendar subscriptions below use the same Groups.io source.</p><iframe class="calendar-frame" loading="lazy" title="MCGB community calendar — Google Calendar schedule" src="${esc(c.googleCalendarEmbedUrl)}&amp;mode=AGENDA" width="800" height="620"></iframe></details></div></div></section><section class="section container" id="subscribe-calendar"><div class="reading"><p class="eyebrow">Calendar subscription</p><h2>Subscribe to our calendar.</h2><p>A subscription keeps community events in your calendar app. Your provider controls refresh timing, so changes may take time to appear. This calendar does not replace checking with individual group organizers.</p><label for="calendar-url"><strong>Calendar subscription URL</strong></label><div class="copy-group"><input class="subscribe-url" id="calendar-url" readonly value="${esc(c.calendarFeedUrl)}"><button data-copy="calendar-url">Copy URL</button></div><p class="copy-status" role="status"></p><div class="actions">${link(c.calendarFeedUrl.replace("https:", "webcal:"), "Try Apple subscription link", "button")}</div><div class="tutorials">${tutorials}</div></div></section>`,
);
await page(
  "join-mailing-list",
  "Join our mailing lists",
  `${intro("Stay connected", "Join our mailing lists.", "Choose the messages you would like to receive. Our mailing lists are managed through Groups.io; the newsletter archive is available separately.")}<section class="section container reading"><div class="subscribe-choice"><h2>Practice announcements</h2><p>Sitting updates, retreats, and community announcements through the Old Path list.</p><p>${link("mailto:oldpath+subscribe@BostonOldPath.groups.io", "Request a practice-list subscription", "button primary")}</p><p class="email-address">oldpath+subscribe@BostonOldPath.groups.io</p></div><div class="subscribe-choice"><h2>Member sharing</h2><p>Member-to-member sharing through the separate Member Sharing list.</p><p>${link("mailto:membersharing+subscribe@BostonOldPath.groups.io", "Request a member-sharing subscription", "button")}</p><p class="email-address">membersharing+subscribe@BostonOldPath.groups.io</p></div><h2>How to subscribe</h2><ol><li>Use the appropriate button to open a new email, or copy the address into your email app.</li><li>Send the subscription request from the email address you want to use.</li><li>Look for a confirmation email from Groups.io and follow its instructions. Check spam if it does not arrive.</li></ol><p>For both lists, send a separate request to each address. A button click alone does not complete a subscription.</p><h2>Manage your subscription</h2><p>Use the subscription preferences or unsubscribe link in a list email. For assistance, contact ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p>${link("/newsletters.html", "Browse the newsletter archive")}</section>`,
);
await page(
  "photo-credits",
  "Photo credits",
  `${intro("Sources & permissions", "Photo credits.", "Photographs connect us with the landscape and lineage of our practice. Plum Village images depict France, rather than a local Boston gathering.")}<section class="section container reading"><h2>Thích Nhất Hạnh</h2><p>Photo by Duc (pixiduc), Paris, 2006. ${link("https://commons.wikimedia.org/wiki/File:Thich_Nhat_Hanh_close-up_(cropped).jpg", "Source on Wikimedia Commons")}. Licensed ${link("https://creativecommons.org/licenses/by-sa/2.0/", "CC BY-SA 2.0")}. The source is already cropped; the website uses a responsive display crop. No other image edits.</p><h2>Still Water Meditation Hall</h2><p>Plum Village, Upper Hamlet, France. Photo by Solipsistic19, 12 July 2022. ${link("https://commons.wikimedia.org/wiki/File:Plum_Village_-_Upper_Hamlet_Still_Water_Meditation_Hall.jpg", "Source on Wikimedia Commons")}. Licensed ${link("https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 4.0")}. Responsive display crop; no other edits.</p><h2>Landscape and historical materials</h2><p>The pond landscape and newsletter cover images were retained from the existing MCGB draft. Historical practice-page illustrations and documents retain their existing context. They are not represented as newly licensed community photographs.</p></section>`,
);
await page(
  "privacy",
  "Privacy & site information",
  `${intro("Site information", "Privacy and external services.", "This site provides information about MCGB practice communities and links to services maintained by others.")}<section class="section container reading"><h2>Calendar, maps, and contributions</h2><p>Embedded Google Calendar and Google Maps content connects to Google’s services. The contribution form is hosted by Google Forms. Visiting or using these services is subject to their own privacy terms. The group directory and website agenda provide first-party alternatives to browsing the embeds.</p><h2>Mailing lists</h2><p>Subscriptions are managed by Groups.io. Follow the confirmation and preferences instructions from that service. We do not enroll you by merely visiting this website.</p><h2>Contact and corrections</h2><p>For site corrections, privacy questions, press inquiries, or accessibility feedback, email ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p><h2>Community information</h2><p>Group details can change. Contact the organizer to confirm a meeting before attending. Historical documents reflect their original publication dates.</p></section>`,
);
await page(
  "accessibility",
  "Accessibility",
  `${intro("Access to practice", "Accessibility statement.", "We aim to make this website usable with keyboards, screen readers, magnification, and a wide range of screen sizes.")}<section class="section container reading"><h2>Scope and assessment</h2><p>This redesign targets WCAG 2.2 Level AA. Release verification covers the first-party HTML pages, navigation, group directory, calendar agenda, and subscription guidance. Assessment date: 19 October 2026. This is an internal verification effort, not an independent accessibility certificate.</p><h2>Known limitations</h2><ul><li>Historical newsletter PDFs and original documents have not been comprehensively remediated.</li><li>The optional Google Calendar view requires sign-in. Google Calendar, Google Maps, Google Forms, and linked websites have their own accessibility behavior. Their complete processes are not certified by this statement.</li><li>The accessible event agenda and group directory remain available independently of the embedded calendar and map.</li><li>Screen-reader coverage and open findings are recorded in the release verification report; untested combinations are not claimed to pass.</li></ul><h2>Feedback and assistance</h2><p>Email ${link(`mailto:${c.contactEmail}`, c.contactEmail)} with the page address, what you were trying to do, and any browser or assistive technology details you wish to share. You may also request help accessing a newsletter article, submitting a contribution, or finding organizer contact information.</p></section>`,
);
await fs.writeFile(
  "public/assets/site-data.json",
  JSON.stringify({ sanghas, calendarFeedUrl: c.calendarFeedUrl }),
);
// All historical design iterations resolve to their canonical destination, including on static preview servers.
const aliases = {
  "bops-homepage-wireframe.html": "/",
  "bops-homepage-wireframe-6.15.26.html": "/",
  "bops-homepage-wireframe-feedback-1.html": "/",
  "mcgb-homepage-wireframe-feedback-2.html": "/",
  "mcgb-homepage-wireframe-feedback-3.html": "/",
};
for (const file of await fs.readdir("public")) {
  if (/-feedback-[123]\.html$/.test(file) && !aliases[file])
    aliases[file] = "/" + file.replace(/-feedback-[123]/, "");
}
for (const [file, url] of Object.entries(aliases))
  await fs.writeFile(
    `public/${file}`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Page moved | MCGB</title><meta http-equiv="refresh" content="0;url=${url}"><a href="${url}">Continue to the current page</a></html>`,
  );
console.log("Generated shared HTML pages.");
