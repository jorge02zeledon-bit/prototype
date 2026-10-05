# Hillside Staff Schedule (prototype)

A mobile-first staff scheduling prototype for a small preschool and elementary school that share staff. Teachers open it on a phone and see, in one glance, **where they are today, what position they are in, and whether they are covering the other age group**. The director builds the week, assigns anyone to either area, sets the position for that shift separately from the person's usual role, sees double-bookings, and publishes so each teacher sees only their own shifts.

- Static web app, no build step: `index.html` + `styles.css` + `core.js` (pure logic) + `seed.js` (sample week) + `app.js` (UI).
- Data lives in the browser's localStorage. There is no server yet; the data model below is written so one can be added later.
- Click-through link: https://claude.ai/artifact/H1cJ7cieF8Uyd4Gdkzkp5D (see **Try it** below).

## Try it

- **Hosted click-through:** https://claude.ai/artifact/H1cJ7cieF8Uyd4Gdkzkp5D (private link; same code as `npm run build:artifact` produces in `dist/artifact.html`).
- **Locally:** open `index.html` in a browser, or run `npm start` and open http://localhost:5173.
- Log in by tapping a name and entering the demo PIN shown under the PIN field. Dana Reyes (PIN `0000`) is the admin; everyone else is a teacher.
- The sample week always lands on the **current school week**. Use **Demo controls → Pretend today is…** (login screen or admin Menu) to walk through Wednesday, Thursday and Friday, which have the cross-coverage shifts. When a demo day is set you can also pick the pretend time of day, so the Now / Later today / Done markers make sense. The admin Menu can hide the demo PINs from the login screen.

Suggested 3-minute tour:

1. Login screen → Demo controls → pretend today is **Wednesday**. Log in as **Maria Lopez (1111)**. Her afternoon card is the plum "Covering Elementary today" block in Room 102.
2. Log out → pretend today is **Thursday** → log in as **Sarah Kim (4444)**: an elementary teacher covering Preschool in the Butterfly Room, with Maria. Then **Keisha Brown (3333)**: out sick, sees "You are not on the schedule today" and what is next.
3. Log in as **Dana Reyes (0000)**. The week builder shows a draft that double-books Alex on Thursday. Tap **Fix 10:00 AM shift**, then **Reassign to someone else** or **Remove this shift**. Add a shift, watch the live "What the teacher will see" card, then **Publish week**.
4. Staff → **View as** any teacher to preview exactly what they see (drafts marked). Day board → see who is in every room.

## Product summary

**Problem.** Staff at a shared preschool and elementary campus are sometimes assigned outside their usual age group. Teachers check their phones and are unsure where to be and what role they are covering, which creates confusion and anxiety.

**What this prototype does.**

- **Teacher "My Schedule"** answers three questions in under five seconds: *Where am I today? What position am I in? Is this my usual role or am I covering?* Today is first, then the rest of the week. Every assignment shows the campus area, room, position, time block, a coverage label when it is outside the person's usual area, and the director's note.
- **Calm by design.** The room is the headline. One status band per card carries the area and the coverage state ("Preschool · Your usual role" or a solid plum "Covering Elementary today"). Cross-coverage cards add who else is in the room, who the teacher is covering for, when they are back in their usual room, and a one-tap way to text the director. Words and icons always accompany color.
- **Admin schedule builder** on the same phone layout: week navigation, day tabs, a bottom-sheet form with a live preview of the teacher's card, soft warnings, double-booking conflicts, a Reassign picker that shows who is free, "Copy last week", a day board of who is where, staff management with usual area/position/room, and "View as" any teacher.
- **Publishing.** Teachers only ever see **published** shifts. Admin edits are drafts until "Publish week" (or "Save & publish now" for one shift). A changed shift keeps showing its last published version to the teacher until it is republished.

**Out of scope for v1:** payroll, time clocks, parent messaging, substitute marketplaces, a real backend, notifications.

## Main screens

### 1. Login
School name, a tappable list of staff (name, usual position, usual area), 4-digit PIN. Demo controls: pretend today is a given weekday, reset demo data.

### 2. Teacher: My Schedule (home)
- Date, greeting, and "Schedule published …" stamp.
- **Today**: one card per block, in time order. If there are two or more blocks, a one-line summary first ("Today: Butterfly Room at 7:30 AM, then Room 102 at 12:30 PM (covering Elementary)").
- **Card anatomy** (top to bottom): status band → room (largest text) → how to find it → position (plus "covering for David Ortiz" when set) → time with Now / Later today / Done → "With you: …" (other staff in that room during the block) → note "From Dana" → on cross-coverage cards: "Tomorrow: Butterfly Room, as usual." and "Questions? Text Dana".
- Nothing today → "You are not on the schedule today." plus a **Next up** card.
- **Heads up** strip when the nearest upcoming cross-coverage block is on a later day ("Heads up: tomorrow you are covering Elementary in Room 102, 12:30 – 3:30 PM, with Priya").
- **Rest of this week**: day groups with compact rows (time, area or coverage badge, room · position). Tap for details (directions, who else is there, note). Earlier days are collapsed. Next week / back to this week.
- Footer: how to reach the director. Log out.

### 3. Admin: Week builder
Week navigation; status card (how many changes are unpublished, conflicts, last published time, **Publish week**); conflict list with "Fix" buttons; Mon–Fri day tabs with shift counts and a conflict flag; the day's shifts (teacher, time, room · position, area badge, coverage badge, Draft/Changed state, overlap warning); **Add a shift**. Empty weeks offer **Copy last week** as drafts.

### 4. Admin: Shift editor (bottom sheet)
Who (shows usual area and position) · Reassign to someone else (lists everyone with "Free then" or "Busy: …") · Date · Time with Morning / Afternoon / Full day chips · Campus area (Preschool / Elementary) with a plain-language cross-coverage hint · Room · Position for this shift · Covering for (optional) · Note · live conflict and warning box · **What the teacher will see** preview card · Save (draft) / Save & publish now / Remove.

### 5. Admin: Day board (Who is where)
Pick a day; every room grouped by Preschool, Elementary and Shared spaces with the people in it, their times, position, coverage badge, and draft markers. Empty rooms say "No one assigned · add someone" and open the editor pre-filled.

### 6. Admin: Staff
List of people with usual area, usual position, usual room. Add/edit (name, usual area incl. Both, usual position, usual room, PIN, role, active). **View as** opens that person's My Schedule in preview mode with drafts marked.

### 7. Admin: Menu
School name, your name (used on notes), phone, contact text; demo controls; reset demo data; log out.

## Sample week

Staff (usual area · usual position · PIN):

| Name | Usual area | Usual position | Usual room | PIN |
|---|---|---|---|---|
| Dana Reyes (admin) | Both | Director | Front Office | 0000 |
| Maria Lopez | Preschool | Lead Preschool Teacher | Butterfly Room | 1111 |
| Tom Nguyen | Preschool | Lead Preschool Teacher | Sunflower Room | 2222 |
| Keisha Brown | Preschool | Preschool Assistant | Butterfly Room | 3333 |
| Sarah Kim | Elementary | Lead Elementary Teacher | Room 101 | 4444 |
| David Ortiz | Elementary | Lead Elementary Teacher | Room 102 | 5555 |
| Priya Patel | Elementary | Elementary Aide | Room 101 | 6666 |
| Alex Rivera | Both | Floating Support | — | 7777 |

Locations: Butterfly Room, Sunflower Room, Preschool Playground (Preschool); Room 101, Room 102, Library (Elementary); Cafeteria, Front Office (shared).

Cross-coverage in the week (bold in the table):

- **Wed PM:** Maria Lopez (Preschool) → Room 102, Lead Teacher, covering for David Ortiz.
- **Thu AM:** Sarah Kim (Elementary) → Butterfly Room, Assistant, covering for Keisha Brown (out sick).
- **Fri PM:** Priya Patel (Elementary) → Sunflower Room, Preschool Assistant, helping Tom with field-trip prep.

Also seeded: one **unpublished draft** on Thursday that double-books Alex Rivera (Front Office 10:00–12:00), so the admin screens show conflict detection. Alex's usual area is Both, so his shifts never get a coverage label.

The dates below are for the week of Oct 5–9, 2026; the app shifts them to whatever the current school week is.

| Day | Time | Teacher (usual area) | Area | Room | Position | Coverage | Note |
|---|---|---|---|---|---|---|---|
| Mon Oct 5 | 7:30 AM – 11:30 AM | Alex Rivera (Both) | Preschool | Sunflower Room | Floating Support | Both areas |  |
| Mon Oct 5 | 7:30 AM – 3:30 PM | Maria Lopez (Preschool) | Preschool | Butterfly Room | Lead Preschool Teacher | Usual |  |
| Mon Oct 5 | 7:30 AM – 3:30 PM | Keisha Brown (Preschool) | Preschool | Butterfly Room | Preschool Assistant | Usual |  |
| Mon Oct 5 | 7:30 AM – 3:30 PM | Tom Nguyen (Preschool) | Preschool | Sunflower Room | Lead Preschool Teacher | Usual |  |
| Mon Oct 5 | 7:45 AM – 11:30 AM | Priya Patel (Elementary) | Elementary | Room 101 | Elementary Aide | Usual |  |
| Mon Oct 5 | 7:45 AM – 3:15 PM | Sarah Kim (Elementary) | Elementary | Room 101 | Lead Elementary Teacher | Usual |  |
| Mon Oct 5 | 7:45 AM – 3:15 PM | David Ortiz (Elementary) | Elementary | Room 102 | Lead Elementary Teacher | Usual |  |
| Mon Oct 5 | 11:30 AM – 12:30 PM | Priya Patel (Elementary) | Elementary | Cafeteria | Lunch & Recess Supervisor | Different position | Elementary lunch, then recess on the big field. |
| Mon Oct 5 | 11:30 AM – 12:30 PM | Alex Rivera (Both) | Preschool | Preschool Playground | Lunch & Recess Supervisor | Both areas |  |
| Mon Oct 5 | 12:30 PM – 3:15 PM | Priya Patel (Elementary) | Elementary | Room 102 | Elementary Aide | Usual |  |
| Mon Oct 5 | 12:30 PM – 3:30 PM | Alex Rivera (Both) | Elementary | Library | Floating Support | Both areas | Reading groups with Room 101 at 1:00. |
| Mon Oct 5 | 3:30 PM – 5:30 PM | Alex Rivera (Both) | Elementary | Cafeteria | Aftercare Supervisor | Both areas |  |
| Tue Oct 6 | 7:30 AM – 11:30 AM | Alex Rivera (Both) | Preschool | Butterfly Room | Floating Support | Both areas |  |
| Tue Oct 6 | 7:30 AM – 3:30 PM | Maria Lopez (Preschool) | Preschool | Butterfly Room | Lead Preschool Teacher | Usual |  |
| Tue Oct 6 | 7:30 AM – 3:30 PM | Keisha Brown (Preschool) | Preschool | Butterfly Room | Preschool Assistant | Usual |  |
| Tue Oct 6 | 7:30 AM – 3:30 PM | Tom Nguyen (Preschool) | Preschool | Sunflower Room | Lead Preschool Teacher | Usual | Fire drill at 10:00. Line up at the back gate. |
| Tue Oct 6 | 7:45 AM – 11:30 AM | Priya Patel (Elementary) | Elementary | Room 102 | Elementary Aide | Usual |  |
| Tue Oct 6 | 7:45 AM – 3:15 PM | Sarah Kim (Elementary) | Elementary | Room 101 | Lead Elementary Teacher | Usual | Fire drill at 10:00. |
| Tue Oct 6 | 7:45 AM – 3:15 PM | David Ortiz (Elementary) | Elementary | Room 102 | Lead Elementary Teacher | Usual | Fire drill at 10:00. |
| Tue Oct 6 | 11:30 AM – 12:30 PM | Priya Patel (Elementary) | Elementary | Cafeteria | Lunch & Recess Supervisor | Different position |  |
| Tue Oct 6 | 11:30 AM – 12:30 PM | Alex Rivera (Both) | Preschool | Preschool Playground | Lunch & Recess Supervisor | Both areas |  |
| Tue Oct 6 | 12:30 PM – 3:15 PM | Priya Patel (Elementary) | Elementary | Room 101 | Elementary Aide | Usual |  |
| Tue Oct 6 | 12:30 PM – 3:30 PM | Alex Rivera (Both) | Elementary | Library | Floating Support | Both areas |  |
| Tue Oct 6 | 3:30 PM – 5:30 PM | Keisha Brown (Preschool) | Preschool | Cafeteria | Aftercare Supervisor | Different position | Aftercare is in the cafeteria this week while the gym floor is redone. |
| Wed Oct 7 | 7:30 AM – 11:30 AM | Alex Rivera (Both) | Elementary | Library | Floating Support | Both areas |  |
| Wed Oct 7 | 7:30 AM – 12:30 PM | Maria Lopez (Preschool) | Preschool | Butterfly Room | Lead Preschool Teacher | Usual |  |
| Wed Oct 7 | 7:30 AM – 3:30 PM | Keisha Brown (Preschool) | Preschool | Butterfly Room | Preschool Assistant | Usual | Alex joins you at 12:30 while Maria is in Room 102. |
| Wed Oct 7 | 7:30 AM – 3:30 PM | Tom Nguyen (Preschool) | Preschool | Sunflower Room | Lead Preschool Teacher | Usual |  |
| Wed Oct 7 | 7:45 AM – 11:30 AM | Priya Patel (Elementary) | Elementary | Room 101 | Elementary Aide | Usual |  |
| Wed Oct 7 | 7:45 AM – 12:30 PM | David Ortiz (Elementary) | Elementary | Room 102 | Lead Elementary Teacher | Usual | Half day. Maria covers your room from 12:30. |
| Wed Oct 7 | 7:45 AM – 3:15 PM | Sarah Kim (Elementary) | Elementary | Room 101 | Lead Elementary Teacher | Usual |  |
| Wed Oct 7 | 11:30 AM – 12:30 PM | Priya Patel (Elementary) | Elementary | Cafeteria | Lunch & Recess Supervisor | Different position |  |
| Wed Oct 7 | 11:30 AM – 12:30 PM | Alex Rivera (Both) | Elementary | Cafeteria | Lunch & Recess Supervisor | Both areas |  |
| Wed Oct 7 | 12:30 PM – 3:15 PM | Priya Patel (Elementary) | Elementary | Room 102 | Elementary Aide | Usual | Maria is covering for David this afternoon. Please help her with the 2:00 transition. |
| Wed Oct 7 | 12:30 PM – 3:30 PM | Maria Lopez (Preschool) | Elementary | Room 102 | Lead Teacher (covering for David) | **Covering Elementary** | David has a dentist appointment. His lesson plans are in the blue binder on his desk. Priya knows the class routine and will be with you all afternoon. Dismissal is at 3:15 from the side door. |
| Wed Oct 7 | 12:30 PM – 3:30 PM | Alex Rivera (Both) | Preschool | Butterfly Room | Floating Support | Both areas | Support Keisha in Butterfly while Maria is in Room 102. |
| Wed Oct 7 | 3:30 PM – 5:30 PM | Alex Rivera (Both) | Elementary | Cafeteria | Aftercare Supervisor | Both areas |  |
| Thu Oct 8 | 7:30 AM – 11:30 AM | Sarah Kim (Elementary) | Preschool | Butterfly Room | Assistant (covering for Keisha) | **Covering Preschool** | Keisha is out sick. Maria is the lead in the room and will show you the morning routine. You will help with breakfast, circle time, and the 10:00 playground block. Nap mats are in the closet by the door. |
| Thu Oct 8 | 7:30 AM – 3:30 PM | Maria Lopez (Preschool) | Preschool | Butterfly Room | Lead Preschool Teacher | Usual | Sarah is with you until 11:30 while Keisha is out. |
| Thu Oct 8 | 7:30 AM – 3:30 PM | Tom Nguyen (Preschool) | Preschool | Sunflower Room | Lead Preschool Teacher | Usual |  |
| Thu Oct 8 | 7:45 AM – 11:30 AM | Priya Patel (Elementary) | Elementary | Room 101 | Elementary Aide | Usual | Alex leads Room 101 this morning while Sarah is in Preschool. |
| Thu Oct 8 | 7:45 AM – 11:30 AM | Alex Rivera (Both) | Elementary | Room 101 | Lead Teacher (covering for Sarah) | Both areas | Lead Room 101 until Sarah is back at 11:30. Morning work is on the front table. |
| Thu Oct 8 | 7:45 AM – 3:15 PM | David Ortiz (Elementary) | Elementary | Room 102 | Lead Elementary Teacher | Usual |  |
| Thu Oct 8 | 10:00 AM – 12:00 PM | Alex Rivera (Both) | Elementary | Front Office | Front Office Support | Both areas · *draft, unpublished* | Cover the front desk while Dana is at the district meeting. |
| Thu Oct 8 | 11:30 AM – 12:30 PM | Priya Patel (Elementary) | Elementary | Cafeteria | Lunch & Recess Supervisor | Different position |  |
| Thu Oct 8 | 11:30 AM – 12:30 PM | Alex Rivera (Both) | Preschool | Preschool Playground | Lunch & Recess Supervisor | Both areas |  |
| Thu Oct 8 | 11:30 AM – 3:15 PM | Sarah Kim (Elementary) | Elementary | Room 101 | Lead Elementary Teacher | Usual | Alex has your class until 11:30. |
| Thu Oct 8 | 12:30 PM – 3:15 PM | Priya Patel (Elementary) | Elementary | Room 102 | Elementary Aide | Usual |  |
| Thu Oct 8 | 12:30 PM – 3:30 PM | Alex Rivera (Both) | Preschool | Butterfly Room | Preschool Assistant (covering for Keisha) | Both areas | Cover Keisha’s afternoon in Butterfly. |
| Fri Oct 9 | 7:30 AM – 11:30 AM | Alex Rivera (Both) | Preschool | Sunflower Room | Floating Support | Both areas |  |
| Fri Oct 9 | 7:30 AM – 3:30 PM | Maria Lopez (Preschool) | Preschool | Butterfly Room | Lead Preschool Teacher | Usual |  |
| Fri Oct 9 | 7:30 AM – 3:30 PM | Keisha Brown (Preschool) | Preschool | Butterfly Room | Preschool Assistant | Usual | Welcome back! |
| Fri Oct 9 | 7:30 AM – 3:30 PM | Tom Nguyen (Preschool) | Preschool | Sunflower Room | Lead Preschool Teacher | Usual | Priya joins you at 12:30 for field trip prep. |
| Fri Oct 9 | 7:45 AM – 11:30 AM | Priya Patel (Elementary) | Elementary | Room 102 | Elementary Aide | Usual |  |
| Fri Oct 9 | 7:45 AM – 3:15 PM | Sarah Kim (Elementary) | Elementary | Room 101 | Lead Elementary Teacher | Usual |  |
| Fri Oct 9 | 7:45 AM – 3:15 PM | David Ortiz (Elementary) | Elementary | Room 102 | Lead Elementary Teacher | Usual |  |
| Fri Oct 9 | 11:30 AM – 12:30 PM | Priya Patel (Elementary) | Elementary | Cafeteria | Lunch & Recess Supervisor | Different position |  |
| Fri Oct 9 | 11:30 AM – 12:30 PM | Alex Rivera (Both) | Preschool | Preschool Playground | Lunch & Recess Supervisor | Both areas |  |
| Fri Oct 9 | 12:30 PM – 3:30 PM | Priya Patel (Elementary) | Preschool | Sunflower Room | Preschool Assistant | **Covering Preschool** | Helping Tom get Pre-K ready for next week’s field trip. Tom will walk you through the pickup routine at 12:30. |
| Fri Oct 9 | 12:30 PM – 3:30 PM | Alex Rivera (Both) | Elementary | Room 101 | Elementary Aide (covering for Priya) | Both areas | Priya is in Preschool this afternoon; you are her cover in Room 101. |
| Fri Oct 9 | 3:30 PM – 5:30 PM | Alex Rivera (Both) | Elementary | Cafeteria | Aftercare Supervisor | Both areas |  |

## Data fields

All records are plain JSON (see `seed.js` for the sample, `core.js` for the logic). Dates are local `YYYY-MM-DD`; times are `HH:MM` in 24-hour form; timestamps are ISO strings.

```
Teacher {
  id                 string      't_maria'
  name               string
  role               'teacher' | 'admin'
  usualArea          'preschool' | 'elementary' | 'both'     // drives the coverage label
  usualPositionId    Position.id                             // "Different position" when a shift differs
  usualLocationId    Location.id | ''                        // pre-fills shifts; "Tomorrow: Butterfly Room, as usual."
  pin                string (4 digits)                       // simple login
  active             boolean                                  // inactive people are hidden from login and pickers
}

Location {
  id        string            'loc_102'
  name      string            'Room 102'
  area      'preschool' | 'elementary' | 'shared'
  detail    string            how to find it, shown on the card
}

Position {
  id        string            'pos_lead'
  label     string            'Lead Teacher'           // exactly what the teacher sees
  area      'preschool' | 'elementary' | 'both'        // filters the picker; mismatches only warn
}

Assignment {                                             // one shift / time block for one person
  id                    string
  teacherId             Teacher.id
  date                  'YYYY-MM-DD'
  start, end            'HH:MM'                          // same day, end > start, overlap is half-open [start, end)
  area                  'preschool' | 'elementary'       // the campus area for THIS shift (source of truth for coverage)
  locationId            Location.id
  positionId            Position.id                      // set per shift, independent of usualPositionId
  coveringForTeacherId  Teacher.id | ''                  // optional: "covering for David Ortiz"
  note                  string                           // optional note from the director
  updatedAt             ISO timestamp
  published             null | {                         // what teachers currently see
    teacherId, date, start, end, area, locationId, positionId, coveringForTeacherId, note,
    publishedAt: ISO timestamp
  }
}

Settings {
  schoolName, adminName, adminPhone, adminContact   strings
  blocks        { am: ['07:30','12:00'], pm: ['12:30','15:30'], full: ['07:30','15:30'] }  // time chips
  demoToday     'YYYY-MM-DD' | null                 // demo override for "today" (only within the current school week)
  demoTime      'HH:MM'                             // pretend time of day while demoToday is set
  showDemoPins  boolean                             // show each person's PIN on the login screen (demo only)
}

State (localStorage key hillside-staff-schedule-v1) {
  version: 1, seedVersion, seededWeekStart, userEdited,
  settings, positions[], locations[], teachers[], assignments[]
}
Session (hillside-staff-schedule-v1-session) { teacherId }
```

Derived, never stored:

- **Coverage** = `Core.coverage(teacher, assignment)`: `cross` when `teacher.usualArea !== 'both'` and `assignment.area !== teacher.usualArea` (label "Covering Elementary today"); `different-position` when same area but a different position; `both` for flex staff; otherwise `usual`.
- **Publish state** = `draft` (never published, invisible to the teacher), `changed` (published before, edited since; the teacher still sees the old version), `published`.
- **Conflicts** = same teacher, same date, overlapping `[start, end)`. Room/position area mismatches and weekend dates are warnings, not errors.
- **With you** = other people's published shifts in the same room overlapping the block.

## Extending it

- **Backend:** the whole state is one JSON document; `core.js` has no DOM or storage dependencies, so the same logic can run on a server. Replace `loadState`/`save` in `app.js` with API calls and keep the snapshot-on-publish model (or move to a per-assignment version history).
- **Auth:** PINs are plain text for the demo; swap for real accounts before any real use.
- **Ideas the design review suggested but v1 leaves out:** removal as a published change (tombstones), publish-per-day, a "Someone's out" quick action, configurable school days and blocks, change history visible to teachers.

## Tests and QA

- `npm test` runs the unit tests for `core.js` and the seed (dates, overlap, coverage, publishing, validation).
- `npm run qa` runs a Playwright click-through at phone width (teacher and admin flows, dark mode, overflow check) and writes screenshots to `dist/qa/`.
- `npm run build:artifact` writes a single-file build to `dist/`.
