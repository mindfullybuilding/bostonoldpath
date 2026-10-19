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
const destinations = [
  ["/our-practice.html", "Our practice"],
  ["/our-community.html", "Our community"],
  ["/find-a-sangha.html#calendar", "Events"],
  ["/resources.html", "Resources"],
  ["/join-mailing-list.html", "Mailing lists"],
];
const menu = destinations.map(([url, label]) => link(url, label)).join("");
const header = `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner container"><a class="brand" href="/" aria-label="Mindfulness Communities of Greater Boston — home"><span class="full-brand">Mindfulness Communities<br>of Greater Boston</span><span class="compact-brand">MCGB</span></a><nav class="desktop-nav" aria-label="Main">${menu}</nav><div class="header-actions">${group}<button class="menu-trigger" data-open-drawer aria-haspopup="dialog" aria-controls="mobile-menu" aria-label="Open menu"><span class="icon icon-menu" aria-hidden="true"></span></button></div></div></header><dialog class="drawer" id="mobile-menu" aria-labelledby="drawer-title"><div class="drawer-top"><h2 id="drawer-title">MCGB</h2><button data-close-dialog aria-label="Close menu"><span class="icon icon-close" aria-hidden="true"></span></button></div><nav aria-label="Mobile main">${menu}${link("/find-a-sangha.html", "Find a group")}</nav></dialog>`;
const footer = `<footer class="site-footer"><div class="container footer-inner"><div><p class="footer-name">Mindfulness Communities of Greater Boston</p><p>Engaged Buddhism in the Plum Village tradition of Thích Nhất Hạnh.</p></div><nav aria-label="Site information"><a href="mailto:${c.contactEmail}">Contact</a><a href="/accessibility.html">Accessibility</a><a href="/photo-credits.html">Photo credits</a><a href="/privacy.html">Privacy &amp; site information</a></nav></div></footer>`;
const communityPages = ["our-community", "community-voices", "newsletters"];
const guidePages = [
  "sangha-overview",
  "sangha-facilitation",
  "minding-the-bell",
  "meeting-and-bell-minding-flow",
  "dharma-sharing-guidelines",
];
function localNavigation(file) {
  const items = communityPages.includes(file)
    ? [
        ["our-community", "About MCGB"],
        ["community-voices", "Community Voices"],
        ["newsletters", "Newsletter archive"],
      ]
    : ["our-practice", "new-here"].includes(file)
      ? [
          ["our-practice", "Our practice"],
          ["new-here", "New here"],
        ]
      : [];
  if (guidePages.includes(file))
    return `<nav class="container breadcrumb" aria-label="Breadcrumb">${link("/resources.html", "Resources")}<span aria-hidden="true">/</span>${link("/resources.html#resource-sangha-resources", "Sangha resources")}</nav>`;
  return items.length
    ? `<nav class="container local-nav" aria-label="${communityPages.includes(file) ? "Our community" : "Our practice"}">${items.map(([id, label]) => `<a href="/${id}.html"${id === file ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`
    : "";
}
const page = async (
  file,
  title,
  body,
  description = "Mindfulness, community, and practice in Greater Boston in the Plum Village tradition.",
) =>
  fs.writeFile(
    `public/${file}.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#3276c2">${file === "home" ? '<link rel="preload" as="image" href="/assets/beginners-mind-page-title-hero.jpg" fetchpriority="high">' : ""}<title>${esc(title)} | MCGB</title><link rel="canonical" href="${c.origin}${file === "home" ? "/" : `/${file}.html`}"><link rel="stylesheet" href="/assets/mcgb.css"><script type="module" src="/assets/mcgb.js"></script></head><body>${header.replaceAll(`href="/${file === "home" ? "" : file + ".html"}"`, `href="/${file === "home" ? "" : file + ".html"}" aria-current="page"`)}<noscript><nav class="container no-script-nav" aria-label="Site destinations"><a href="/new-here.html">New here</a><a href="/find-a-sangha.html">Groups &amp; events</a><a href="/resources.html">Resources</a><a href="/our-community.html">Our community</a><a href="/join-mailing-list.html">Mailing lists</a></nav></noscript><main id="main" tabindex="-1" data-page="${file}">${localNavigation(file)}${body.replace(/[ \t]+$/gm, "")}</main>${footer}</body></html>`,
  );
const intro = (eyebrow, title, copy) =>
  `<section class="page-intro container"><div class="reading"><h1>${title}</h1><p class="lede">${copy}</p></div></section>`;
const card = (n, title, copy, url) =>
  `<article class="card"><h3>${link(url, title)}</h3><p>${copy}</p></article>`;
const agenda = (limit = 10) =>
  `<div data-agenda data-limit="${limit}"><p class="calendar-label">Times shown in America/New_York (Eastern time).</p><p class="agenda-status" role="status">Loading upcoming events…</p><div class="agenda-list"></div><div class="agenda-controls"><button data-retry>Refresh events</button><button data-more hidden>Show more events</button></div><noscript><p>The live agenda needs JavaScript. ${link(c.googleCalendarEmbedUrl, "Open Google Calendar")} or use the <a href="/find-a-sangha.html#subscribe-calendar">calendar subscription guide</a>.</p></noscript></div>`;
await page(
  "home",
  "A deep bow to you, dear friend",
  `<section class="hero"><div class="hero-content container"><h1>A deep bow to you, dear friend.</h1><p class="lede">Mindfulness Communities of Greater Boston is an interfaith collective that seeks to learn and practice mindfulness taught by Thích Nhất Hạnh (“Thầy”), a Vietnamese Buddhist monk, author and activist.</p><div class="actions">${group}${link("/new-here.html", "New here", "hero-link")}</div></div></section>
  <section class="section container home-practice"><h2>Practice &amp; community</h2><p class="home-introduction">We explore ways to bring mindfulness into our lives, families, work, and society. We try to practice mindfulness throughout every day, not just during meditation, but also in the kitchen, in the car, at work, on the phone, and while walking from one place to another.</p><div class="route-grid">${card("", "Our practice", "An intro to mindfulness & mindful living, Thích Nhất Hạnh, and the Plum Village tradition.", "/our-practice.html", "Our practice")}${card("", "Our community", "Meet MCGB and discover how we practice together.", "/our-community.html", "Our community")}${card("", "Resources", "Find foundational readings, talks, songs, practice links, and beginner-friendly resources.", "/resources.html", "Resources")}</div></section>
  <section class="section container home-voices"><div><h2>Community Voices</h2><p>Read community writing in <em>The Present Moment</em>, or submit art, writing, songs, and photographs for review.</p><div class="actions">${link("/community-voices.html", "About contributions", "button")}</div></div><a class="newsletter-feature" href="/newsletters.html"><img src="/assets/newsletters/april-2026.png" alt="" width="90" height="120" loading="lazy"><span><strong>The Present Moment</strong><span>April 2026</span><span class="underlined">Browse the newsletter archive</span></span></a></section>
  <section class="section container home-updates"><div><div class="section-head"><h2>Community events</h2><p>Regular sangha schedules are in the group directory.</p></div>${agenda(3)}${link("/find-a-sangha.html#calendar", "Calendar and subscription guide", "text-link")}</div><div class="mailing-note"><h2>Mailing lists</h2><p>Receive sitting updates, retreat information, and community announcements.</p>${link("/join-mailing-list.html", "Join our mailing lists", "text-link")}</div></section>`,
);
await page(
  "new-here",
  "New here",
  `<article class="section container reading"><h1>New here</h1><p class="lede">You may be curious about meditation, returning to practice, or looking for people to practice with. You can begin by learning about a group and contacting its organizer.</p><h2>What is a sangha?</h2><p>Sangha means a community of practice. In our tradition, friends support one another in cultivating mindfulness, understanding, and compassion.</p><h2>Choosing a group</h2><p>Compare location, meeting format, and schedule. Some groups have a particular focus or community; read the details before joining.</p><p>Confirm the next meeting, joining instructions, registration or cost, and any access arrangements with that group’s organizer.</p><h2>What might a gathering include?</h2><p>Groups may practice sitting meditation, walking meditation, readings, mindful listening, and Dharma sharing — reflecting together on life and practice. The format and length vary by group.</p><h2>Access and participation</h2><p>Ask the organizer about chairs, movement, restrooms, stairs, sensory needs, online captions, or anything else that would help you participate. The directory preserves organizer-provided access information; it is not a verified accessibility survey of venues.</p><div class="actions">${group}</div></article>`,
);
await page(
  "our-community",
  "Our community",
  `<article class="section container reading"><h1>Our community</h1><p>Mindfulness Communities of Greater Boston (MCGB) represents a large number of ${link("/find-a-sangha.html", "sanghas")} that practice in the tradition of ${link("https://plumvillage.org/", "Plum Village")} (founded by Thich Nhat Hanh). This includes ${link("/resources.html#practice-now", "reading the Dharma")}, gathering as Sangha, and engaging with our inner Buddha to find presence of mind, and compassion for all beings.</p><p>The many Sanghas practice both individually and collectively, with independent Sanghas meeting regularly and practicing in a way fitting their members, and collectively gathering for ${link("/find-a-sangha.html#calendar", "events")} such as peaceful walks, ceremonies such as the ${link("/resources.html#resource-five-mindfulness-trainings", "5 Mindfulness Trainings")} transmission, Days of Mindfulness, and groups such as the book club.</p><p>While Mindful Communities of Greater Boston is a newer initiative, the community of practice in the Boston region has a great history, including many visits from Thich Nhat Hanh and many members of the ${link("/resources.html#resource-order-of-interbeing", "Order of Interbeing")} (an order of ordained lay individuals). Learn more under ${link("/resources.html", "Resources")}.</p><section class="related-pages"><h2>Togetherness</h2><p>Find dear friends nearby and invite space for a walk, a cup of tea, or time together outside scheduled practice.</p>${link("https://togethernessma.vercel.app/", "Visit Togetherness")}</section></article>`,
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
  `${intro("", "Community Voices", "Art, writing, song, and reflection from our community.")}<section class="section container reading"><h2>Submit a contribution</h2><p>Share a link to your art, writing, song, photograph, or other contribution, along with a title and description. The contribution form also asks about collaborators.</p><p>Please share only work you have permission to submit. A person reviews submissions; completing the form does not publish your work automatically.</p>${form}<p class="small form-note">Opens a Google Form. The form accepts links and descriptions, rather than direct file uploads.</p><p>If the form is difficult to use, email ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p><section class="related-pages"><h2>Community writing</h2><p>Read published writing and reflections in ${link("/newsletters.html", "The Present Moment newsletter archive")}.</p></section></section>`,
);
await page(
  "newsletters",
  "Newsletter archive",
  `${intro("The Present Moment", "The Present Moment", "The Newsletter of Mindfulness Communities of Greater Boston brings together community updates, reflections, and practice.")}<section class="section container"><div class="issue-grid">${issueCards}</div><div class="callout"><h2>Accessing historical editions</h2><p>These PDFs are retained in their original form and have not been comprehensively remediated for accessibility. For help with a particular article or edition, email ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p></div><div class="actions">${link("/join-mailing-list.html", "Join our mailing lists", "button primary")}${link("/community-voices.html", "Contribute to Community Voices", "button")}</div></section>`,
);
function resource(item) {
  const id = item.id ? ` id="resource-${esc(item.id)}"` : "";
  if (item.unavailable) return "";
  if (["become-a-mentor", "update-sangha-details"].includes(item.id)) return "";
  if (item.id === "join-builder-sangha")
    return `<div class="builder-inquiry" id="resource-join-builder-sangha"><h3>Community builder inquiries</h3><p>For questions about Builder Sangha, <span id="resource-become-a-mentor">mentoring</span>, or <span id="resource-update-sangha-details">updating sangha details</span>, ${link(`mailto:${c.contactEmail}`, "email MCGB")}.</p></div>`;
  if (item.subtiles)
    return `<details class="resource-detail"${id}><summary>${esc(item.title)}</summary><p>${esc(item.copy)}</p><div class="resource-grid">${item.subtiles.map(resource).join("")}</div></details>`;
  return `<article class="resource-card"${id}><h3>${item.url ? link(item.url, esc(item.title)) : esc(item.title)}</h3><p>${esc(item.copy)}</p>${item.unavailable ? '<p class="small muted">This resource is not yet available.</p>' : ""}${item.relatedUrl ? link(item.relatedUrl, "Related resource") : ""}</article>`;
}
await page(
  "resources",
  "Resources",
  `${intro("Resources", "Practice resources", "Plum Village teachings and tools for practice, with links to our wider community.")}<div class="container"><nav class="resource-jumps" aria-label="Resource categories">${resources.map(([id, title]) => link(`#${id}`, esc(title))).join("")}</nav>${resources.map(([id, title, items]) => `<section class="section resource-group" id="${id}"><h2>${esc(title)}</h2><div class="resource-grid">${items.map(resource).join("")}</div></section>`).join("")}</div>`,
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
  if (guidePages.includes(file))
    body = body
      .replace(/<p class="eyebrow">[\s\S]*?<\/p>/, "")
      .replace(/<nav aria-label="Related Sangha resources">[\s\S]*?<\/nav>/, "")
      .replace("<p>Guidance for caring for our practice together.</p>", "");
  await page(
    file,
    file
      .split("-")
      .map((x) => x[0].toUpperCase() + x.slice(1))
      .join(" "),
    `<div class="section container">${body}${
      guidePages.includes(file)
        ? `<nav class="guide-navigation reading" aria-label="Sangha guides">${guidePages
            .filter((id) => id !== file)
            .map((id) =>
              link(
                `/${id}.html`,
                {
                  "sangha-overview": "Sangha Facilitation Overview",
                  "sangha-facilitation": "Sangha Facilitation",
                  "minding-the-bell": "Minding the Bell",
                  "meeting-and-bell-minding-flow": "Meeting and Bell Minding Flow",
                  "dharma-sharing-guidelines": "Dharma Sharing Guidelines",
                }[id],
              ),
            )
            .join("")}</nav>`
        : ""
    }</div>`,
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
    const directions =
      s.modality !== "virtual" && s.address
        ? link(
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`,
            "Get directions",
            "text-link",
          )
        : "";
    const contactLabel = /email[12]@gmail/.test(s.registerUrl)
      ? "Ask MCGB for organizer contact"
      : "Contact organizer";
    return `<article class="group-card" id="${s.id}" data-group="${s.id}"><h2>${esc(s.name)}</h2><dl class="group-metadata"><dt>Day</dt><dd>${esc(s.day)}</dd><dt>Time</dt><dd>${esc(s.time)}</dd><dt>Location</dt><dd>${esc(s.location)}</dd></dl><details><summary>More details</summary><p>${esc(s.description)}</p><dl class="metadata"><dt>Format</dt><dd>${s.modality === "virtual" ? "Online" : s.modality === "hybrid" ? "Hybrid" : "In person"}</dd>${s.address ? `<dt>Location</dt><dd>${esc(s.address)}</dd>` : ""}${s.access && s.access.trim().toLowerCase() !== (s.address || "").trim().toLowerCase() ? `<dt>Joining &amp; access</dt><dd>${esc(s.access)}</dd>` : ""}</dl>${directions}<p>Confirm current meeting details and access needs with the organizer.</p>${s.registerUrl.startsWith("mailto:") && !/email[12]@gmail/.test(s.registerUrl) ? `<p class="email-address small">${esc(decodeURIComponent(s.registerUrl.slice(7)).replace("?cc=", ", "))}</p>` : ""}</details>${link(contact, contactLabel, "button organizer-contact")}</article>`;
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
  `<section class="container finder-page"><div class="finder-heading"><h1>Find a sangha</h1><p>Find a practice community in Greater Boston by format, day, and time.</p><div class="finder-shortcuts"><a href="#calendar">Community events &amp; calendar</a><button class="filter-trigger" data-filter-toggle aria-expanded="false" aria-controls="group-filters">Filter groups</button></div></div><div class="finder-layout"><form class="filters" id="group-filters" aria-label="Filter groups"><h2>Filter sanghas</h2><label for="group-search">Search name or place</label><input type="search" id="group-search" name="search" placeholder="e.g. Brookline"><div class="filter-sheet">${filters.map(([key, title, opts]) => `<details><summary>${title}</summary><fieldset><legend class="sr-only">${title}</legend>${opts.map(([value, label]) => `<label><input type="checkbox" name="${key}" value="${value}"> ${label}</label>`).join("")}</fieldset></details>`).join("")}</div><button type="reset" class="text-button">Clear filters</button></form><div class="directory-results"><div class="results-top"><p id="group-count" role="status">13 sanghas</p></div><div class="group-list">${groupsHTML}</div><div id="no-groups" class="status-box" hidden><h2>No matching groups</h2><p>Try fewer filters or a different place.</p><button data-clear-filters>Clear filters</button></div></div><aside class="finder-aside" aria-label="Map and community calendar"><details class="region-map" open><summary>Regional sangha map</summary><iframe loading="lazy" title="Supplementary map of regional sanghas" src="https://www.google.com/maps/d/embed?mid=1TBbpA9rWK7PatKg8S-NV2kAVLRAaE_c&amp;ehbc=2E312F" width="100%" height="320"></iframe><p class="small">Map locations do not change with the filters. Use the directory for schedules and contacts.</p></details><section id="calendar" class="finder-calendar"><h2>Community events</h2><p>Regular sangha schedules are listed in the directory. Its filters do not change this calendar.</p>${link("#subscribe-calendar", "Subscribe to calendar", "button primary")}${agenda()}<details class="calendar-disclosure"><summary>Google Calendar (sign-in required)</summary><p class="small">This optional Google view requires sign-in and may require account access. The public agenda and subscriptions use the same Groups.io source.</p>${link(c.googleCalendarEmbedUrl, "Open Google Calendar")}<iframe class="calendar-frame" loading="lazy" title="MCGB community calendar — Google Calendar schedule" src="${esc(c.googleCalendarEmbedUrl)}&amp;mode=AGENDA" width="800" height="620"></iframe></details></section></aside></div></section><section class="section container" id="subscribe-calendar"><div class="reading"><p class="eyebrow">Calendar subscription</p><h2>Subscribe to our calendar.</h2><p>A subscription keeps community events in your calendar app. Your provider controls refresh timing, so changes may take time to appear. This calendar does not replace checking with individual group organizers.</p><label for="calendar-url"><strong>Calendar subscription URL</strong></label><div class="copy-group"><input class="subscribe-url" id="calendar-url" readonly value="${esc(c.calendarFeedUrl)}"><button data-copy="calendar-url">Copy URL</button></div><p class="copy-status" role="status"></p><div class="actions">${link(c.calendarFeedUrl.replace("https:", "webcal:"), "Try Apple subscription link", "button")}</div><div class="tutorials">${tutorials}</div></div></section>`,
);
await page(
  "join-mailing-list",
  "Join our mailing lists",
  `${intro("Stay connected", "Join our mailing lists", "Choose the messages you would like to receive. Our mailing lists are managed through Groups.io; the newsletter archive is available separately.")}<section class="section container reading"><div class="subscribe-choice"><h2>Practice announcements</h2><p>Sitting updates, retreats, and community announcements through the Old Path list.</p><p>${link("mailto:oldpath+subscribe@BostonOldPath.groups.io", "Request a practice-list subscription", "button primary")}</p><p class="email-address">oldpath+subscribe@BostonOldPath.groups.io</p></div><div class="subscribe-choice"><h2>Member sharing</h2><p>Member-to-member sharing through the separate Member Sharing list.</p><p>${link("mailto:membersharing+subscribe@BostonOldPath.groups.io", "Request a member-sharing subscription", "button")}</p><p class="email-address">membersharing+subscribe@BostonOldPath.groups.io</p></div><h2>How to subscribe</h2><ol><li>Use the appropriate button to open a new email, or copy the address into your email app.</li><li>Send the subscription request from the email address you want to use.</li><li>Look for a confirmation email from Groups.io and follow its instructions. Check spam if it does not arrive.</li></ol><p>For both lists, send a separate request to each address. A button click alone does not complete a subscription.</p><h2>Manage your subscription</h2><p>Use the subscription preferences or unsubscribe link in a list email. For assistance, contact ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p>${link("/newsletters.html", "Browse the newsletter archive")}</section>`,
);
await page(
  "photo-credits",
  "Photo credits",
  `${intro("Sources & permissions", "Photo credits.", "Sources and permissions for current and retained photographs.")}<section class="section container reading"><h2>Thích Nhất Hạnh</h2><p>Photo by Duc (pixiduc), Paris, 2006. ${link("https://commons.wikimedia.org/wiki/File:Thich_Nhat_Hanh_close-up_(cropped).jpg", "Source on Wikimedia Commons")}. Licensed ${link("https://creativecommons.org/licenses/by-sa/2.0/", "CC BY-SA 2.0")}. The source is already cropped; the website uses a responsive display crop. No other image edits.</p><h2>Still Water Meditation Hall</h2><p>Plum Village, Upper Hamlet, France. Photo by Solipsistic19, 12 July 2022. ${link("https://commons.wikimedia.org/wiki/File:Plum_Village_-_Upper_Hamlet_Still_Water_Meditation_Hall.jpg", "Source on Wikimedia Commons")}. Licensed ${link("https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 4.0")}. Responsive display crop; no other edits.</p><h2>Landscape and historical materials</h2><p>The pond landscape and newsletter cover images were retained from the existing MCGB draft. Historical practice-page illustrations and documents retain their existing context. They are not represented as newly licensed community photographs.</p></section>`,
);
await page(
  "privacy",
  "Privacy & site information",
  `${intro("Site information", "Privacy and external services.", "This site provides information about MCGB practice communities and links to services maintained by others.")}<section class="section container reading"><h2>Calendar, maps, and contributions</h2><p>Embedded Google Calendar and Google Maps content connects to Google’s services. The contribution form is hosted by Google Forms. Visiting or using these services is subject to their own privacy terms. The group directory and website agenda provide first-party alternatives to browsing the embeds.</p><h2>Mailing lists</h2><p>Subscriptions are managed by Groups.io. Follow the confirmation and preferences instructions from that service. We do not enroll you by merely visiting this website.</p><h2>Contact and corrections</h2><p>For site corrections, privacy questions, press inquiries, or accessibility feedback, email ${link(`mailto:${c.contactEmail}`, c.contactEmail)}.</p><h2>Community information</h2><p>Group details can change. Contact the organizer to confirm a meeting before attending. Historical documents reflect their original publication dates.</p></section>`,
);
await page(
  "accessibility",
  "Accessibility",
  `${intro("Access to practice", "Accessibility statement.", "We aim to make this website usable with keyboards, screen readers, magnification, and a wide range of screen sizes.")}<section class="section container reading"><h2>Scope and assessment</h2><p>This redesign targets WCAG 2.2 Level AA. Release verification covers the first-party HTML pages, navigation, group directory, calendar agenda, and subscription guidance. Assessment date: 19 October 2026. This is an internal verification effort, not an independent accessibility certificate.</p><h2>Known limitations</h2><ul><li>Historical newsletter PDFs and original documents have not been comprehensively remediated.</li><li>The optional Google Calendar view requires sign-in. Google Calendar, Google Maps, Google Forms, and linked websites have their own accessibility behavior. Their complete processes are not certified by this statement.</li><li>Testing found unlabeled controls, invalid ARIA attributes, and contrast and target-size problems inside Google’s embedded map. The full group directory, schedules, and organizer contacts remain available independently of the map.</li><li>The public event agenda works independently of the optional Google Calendar view.</li><li>Screen-reader coverage and open findings are recorded in the release verification report; untested combinations are not claimed to pass.</li></ul><h2>Feedback and assistance</h2><p>Email ${link(`mailto:${c.contactEmail}`, c.contactEmail)} with the page address, what you were trying to do, and any browser or assistive technology details you wish to share. You may also request help accessing a newsletter article, submitting a contribution, or finding organizer contact information.</p></section>`,
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
