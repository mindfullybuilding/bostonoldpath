import { link } from "../html.mjs";
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
    "Other Calendar Apps",
    "other",
    [
      "Find an option called Subscribe by URL, Add calendar from URL, or Internet calendar.",
      "Paste the subscription URL above and confirm. Choose a name such as MCGB community events.",
      "Use a subscription to receive later changes. Importing an .ics file once usually creates a static copy.",
    ],
    "Use the app’s calendar settings to remove or unsubscribe from this calendar.",
  );

export function subscriptionView(calendarFeedUrl) {
  return {
    calendarFeedUrl: calendarFeedUrl,
    appleSubscriptionLink: link(
      calendarFeedUrl.replace("https:", "webcal:"),
      "Try Apple Subscription Link",
      "button",
    ),
    tutorials: tutorials,
  };
}
