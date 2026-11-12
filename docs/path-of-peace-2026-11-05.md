# Path of Peace Sangha — directory addition

Added to the shared directory data and rendered in both the production and calligraphy-preview versions. The original 13 records are preserved; the directory now has 14. Initial HTML count now derives from the directory length, matching the existing client-side count.

Sources: the user's Plumline screenshot and requested organizer URL, https://new.plumline.org/sanghas/path-of-peace-sangha-franklin. The group's own https://pathsangha.com/ and host congregation's https://fusf.org/community/programs-activities/path-peace-sangha/ corroborate Monday meetings from 7:00–8:30 PM, the second Monday in person and other Mondays on Zoom. The address and Robin/Ann contact names come from the supplied screenshot. No coordinates were guessed.

The existing Hybrid category is used for this alternating in-person/online schedule; the Day and Joining & Access text explicitly explain the distinction. As a weekly Monday group, it is included in Today's Sanghas every Monday. Organizer contact uses the user's exact requested Plumline URL.

Verification: both generated HTML directories and JSON data contain the record and a count of 14; Monday schedule inclusion was checked for the first, second and third Mondays; existing schedule tests passed. In-app browser search for Franklin returned exactly the new record, and expanded details showed the requested address, schedule and contact link. Deployment evidence is recorded in outputs/path-of-peace/.

The subsequent homepage cleanup removes the schedule introduction, information disclosure, separate organizer-check heading and confirmation prompts on both sites. All displayed groups share one time-ordered list. The defined Every other Thursday frequency remains visible, and the accessible row count includes every displayed group. In-app browser checks confirmed matching clean schedules on both published homepages; see `outputs/path-of-peace/schedule-checks.json`.
