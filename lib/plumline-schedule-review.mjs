import {
  bostonDayBounds,
  bostonTimeZone,
  meetingDateAt,
  meetingOccurrences,
} from "../public/assets/sangha-occurrences.js";

const dandelionsSchedule = "https://www.yenkuei.org/services";
const wakeUpSchedule = "https://bostonwakeup.substack.com/about";
const wakeUpSunday = "2026-12-13";

const confirmedWakeUpMeeting = {
  id: "organizer-2026-12-13",
  listedUntil: wakeUpSunday,
  format: "in-person",
  rule: {
    freq: "daily",
    interval: 1,
    count: 1,
    dtstart: `${wakeUpSunday}T19:00`,
    tzid: bostonTimeZone,
  },
  durationMinutes: 90,
  days: ["sunday"],
  dayLabel: "Sunday, December 13, 2026",
  timeLabel: "7:00 PM–8:30 PM",
  timeBand: "evening",
};

function meetingMetadata(meetings) {
  return {
    meetings,
    day:
      meetings
        .map(({ dayLabel }) => dayLabel)
        .filter(Boolean)
        .join("; ") || "See meeting details",
    time:
      meetings
        .map(({ timeLabel }) => timeLabel)
        .filter(Boolean)
        .join("; ") || "See meeting details",
    days: [...new Set(meetings.flatMap(({ days }) => days ?? []))],
    timeBand: meetings[0]?.timeBand ?? null,
  };
}

function isDisputedDandelionsMeeting({ format, rule, durationMinutes }) {
  // The teacher advertises Zoom at this time. The imported in-person row has no approved venue.
  return (
    format === "in-person" &&
    rule?.freq === "daily" &&
    rule.interval === 1 &&
    rule.count == null &&
    rule.until == null &&
    rule.tzid === bostonTimeZone &&
    rule.dtstart?.slice(11, 16) === "06:30" &&
    durationMinutes === 45
  );
}

function reviewDandelions(sangha) {
  const view = { ...sangha, scheduleSourceUrl: dandelionsSchedule };
  if (sangha.publicVenue === true || !sangha.meetings?.some(isDisputedDandelionsMeeting))
    return view;

  const meetings = sangha.meetings.filter((meeting) => !isDisputedDandelionsMeeting(meeting));
  const formats = [...new Set(meetings.map(({ format }) => format).filter(Boolean))];
  const modality = formats.length > 1 ? "hybrid" : (formats[0] ?? null);
  return {
    ...view,
    ...meetingMetadata(meetings),
    modality,
    location: modality === "virtual" ? "Online" : sangha.location,
    meetingDescription: "The daily sitting’s format is pending confirmation.",
  };
}

function reviewWakeUp(sangha, now) {
  const view = { ...sangha, scheduleSourceUrl: wakeUpSchedule };
  const day = bostonDayBounds(wakeUpSunday);
  if (!Array.isArray(sangha.meetings) || now >= day[1]) return view;

  const [start] = meetingOccurrences(confirmedWakeUpMeeting, day);
  const sameSlot = new Set(
    sangha.meetings.filter((meeting) =>
      meetingOccurrences({ ...meeting, excludeDates: [], excludeOrdinals: [] }, day).includes(
        start,
      ),
    ),
  );
  for (const meeting of sameSlot) {
    if (
      !meetingOccurrences(meeting, day).includes(start) ||
      (meeting.format === confirmedWakeUpMeeting.format &&
        meeting.durationMinutes === confirmedWakeUpMeeting.durationMinutes)
    )
      return view;
  }

  // The organizer supplies the format and duration for this date only. Honor
  // explicit cancellation above and preserve every other imported occurrence.
  const meetings = sangha.meetings.map((meeting) =>
    sameSlot.has(meeting)
      ? {
          ...meeting,
          excludeDates: [...(meeting.excludeDates ?? []), meetingDateAt(start, meeting.rule.tzid)],
        }
      : meeting,
  );
  return { ...view, meetings: [...meetings, confirmedWakeUpMeeting] };
}

export function applyPlumlineScheduleReview(sanghas, now = Date.now()) {
  return sanghas.map((sangha) => {
    if (sangha.id === "dandelions-of-the-heart-sangha") return reviewDandelions(sangha);
    if (sangha.id === "wake-up-boston") return reviewWakeUp(sangha, now);
    return sangha;
  });
}
