const issues = [
  ["April 2026", "April2026_Newsletter_Final.pdf", "april-2026.png"],
  ["Spring 2022", "Spring2022_Newsletter_Final.pdf", "spring-2022.png"],
  ["Winter 2022", "Winter2022_Newsletter_Final.pdf", "winter-2022.png"],
];
const archiveYears = [2026, 2022]
  .map(
    (year) =>
      `<section class="year-group" aria-labelledby="year-${year}"><h2 id="year-${year}">${year}</h2><div class="issue-grid">${issues
        .filter(([name]) => name.endsWith(String(year)))
        .map(
          ([name, pdf, img]) =>
            `<article class="issue-card"><a href="/assets/${pdf}" aria-label="Read ${name} edition of The Present Moment (PDF)"><figure><img src="/assets/newsletters/${img}" alt="" width="300" height="400" loading="lazy"><figcaption><h3>${name}</h3><span>The Present Moment</span><span class="underlined">Read edition (PDF)</span></figcaption></figure></a></article>`,
        )
        .join("")}</div></section>`,
  )
  .join("");

export function newsletterView() {
  return { archiveYears };
}
