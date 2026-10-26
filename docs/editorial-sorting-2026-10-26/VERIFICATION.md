# Editorial and Directory Update — 26 October 2026

Implemented the requested accented spellings, title case for headings and actions, Find a Sangha labels, the italicized homepage heading, and removal of the requested personal author credits. The three public newsletter PDFs received text corrections, including the editor credit in April 2026 and the personal acknowledgment in Winter 2022. Public cover previews were regenerated; preserved source archives remain excluded from deployment.

The Plum Village App is the first resource in Practice Now. It uses the shared resource-card component and the newcomer-page description. Practice with Us uses the supplied tiger/mountain paragraph verbatim.

| Element | Previous | Current |
| --- | --- | --- |
| Directory order | Source-record order | Weekday names A–Z by default; text button toggles Z–A |
| Desktop controls | Count alone | Sort on the left and count on the right, vertically centered |
| Mobile controls | Filter and count | Filter on the left; sort above count on the right |
| Count | Proportional numbers, lowercase sanghas | Tabular numbers and Sanghas |
| Homepage heading | Greeting | Supplied tradition heading; one line at 1024px and 1440px, balanced wrapping below |

Sort keys use the first weekday in each record. Monthly ordinals do not override the weekday; sangha name breaks ties. Sorting preserves filters, disclosures, and keyboard focus, and announces changes through a live status. Default HTML is sorted and all contacts remain available without JavaScript.

Validation: build, lint, 11 unit tests, Chromium/WebKit sorting and filter tests at 320/390/768/1024/1440px, automated accessibility checks excluding third-party frames, hero fallback/print/forced-color checks, navigation journeys, general browser checks, enlarged text, no-JavaScript content, and internal links. Browser evidence and deployment details are local under ignored outputs/editorial-2026-10-26/.

Case-insensitive searches found no Kwan or Quan text matches in current website sources, preserved prototypes, or extracted newsletter PDF text. This does not search text baked into images or content maintained by linked third-party services.

Native screen-reader testing and third-party-frame accessibility are not certified by these checks. Newsletter corrections do not constitute comprehensive PDF accessibility remediation.
