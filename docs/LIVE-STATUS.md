# Where the platform stands

Updated 27 July 2026.

This is a plain-language rundown of what the platform does today. It replaces
the earlier version of this document, which described a system where the core
worked and the surrounding screens were still sample content.

That is no longer the split. **Every screen now reads and writes the real
database.** The file `lib/database.ts` — 1,500 lines of fictional students,
courses and announcements that the placeholder screens were reading from — has
been deleted, along with the test-data viewer that existed to inspect it. There
is nothing left for a screen to fall back to.

Two things are deliberately *not* built, and say so on screen rather than
pretending: fees/billing, and password-reset emails. Both are noted at the end.

## Things everyone gets, whatever their role

Signing in and out works with real accounts and hashed passwords, and where you
land depends on your role. The app stops you reaching pages you shouldn't — a
student typing `/admin` gets sent back.

The header shows your real name, the notification bell shows your real
notifications, and Messages is fully working, with live delivery when the
messaging keys are configured.

Everyone can now also:

- upload a **profile photo**, and edit their own details
- read and post to **announcements**, and reply to them
- start and reply to **discussions**, edit their own posts, and delete them
- see a real **calendar** — class events, school events, and assignment
  deadlines pulled straight from the assignments so the two can't disagree
- keep **private notes**, tied to a class if they want
- use **My Media** and the **E-Portfolio** to upload, preview, download and
  delete real files
- read the **Digital Library**
- go **back** and land on the page they actually came from

## Admin

Everything under the Admin menu is real.

- **Dashboard** — live counts and a recent-activity feed.
- **User Management** — create anyone, edit anyone (name, email, role, status,
  password), link parents to their children, capture enrolment details (phone,
  address, parent/guardian contacts), and **promote a student to the next grade**.
- **Class Management** — create, edit, view, archive, and now **delete** a class
  (refused while it still has students or lessons, with a message saying so).
  The teacher can be **reassigned** after creation. Classes carry a **grade
  level** as well as a room — the room is the physical classroom, the grade level
  is the year group, and promotion uses it.
- **Lesson Management** — create, edit, reorder, **move a lesson to another
  class**, and delete.
- **Grade Management** — the school-wide gradebook.
- **Skills & Standards** — the grade-level standards.
- **Categories** — the filing tree (e.g. 1st Grade › Math › Unit 1 › Lesson 1.1)
  used by media, the library, portfolios and seminars. Any depth; renaming
  re-files everything beneath it; a category can't be deleted while anything is
  still in it.
- **Attendance** — take a register, and review each student's record.
- **Calendar** — the school-wide calendar.
- **Notifications** — send a short message to a role, a class, or everyone.

## Teacher

Everything a teacher could do before, plus:

- **Course content** — add, edit, reorder and delete lessons; attach a video
  (YouTube, Vimeo or a direct file — it plays), write the lesson text, and move
  a lesson to a different class.
- **Quizzes and tests** — write them here. Multiple choice, select-all,
  true/false, short answer and essay. Everything but the essay is marked
  automatically; essays come to the teacher, who marks them on the results page.
  **Practice problems** attach to a lesson and appear under it.
- **Results** — per-attempt breakdown, class average, and how many are awaiting
  marking.
- **Surveys** — write one, choose whether students, parents or teachers are
  asked, open and close it, and read the collated results.
- **Attendance** — take the register for a class.
- **Progress reports** — upload a report card per student per term.
- **Class progress** — every student's real position: lessons, work handed in
  and marked, quizzes, average, last active. Names are clickable.
- **Class list** — the roster, with CSV export and one-click messaging.
- **Groups** — split a class into working groups.

## Student

Everything before, plus:

- **Lessons** that actually work: watch the video, read the content, download the
  materials, and **complete a lesson to unlock the next**. The sequence is
  enforced on the server, not just hidden in the interface.
- **Quizzes, tests and practice problems** answered on the platform, marked
  immediately where they can be, with the correct answers and explanations shown
  afterwards if the teacher allows it.
- **Groups**, **surveys**, **notes**, **e-portfolio**, **my media**.
- **Academic records** — a real transcript, with CSV export, plus any report
  cards the school has filed.
- **Study plan** — progress through each enrolled course.

## Parent

- **My Family** — a parent home. If you have more than one child, the switcher
  lives here and is remembered between visits; each child's overall grade,
  per-course marks, recent progress reports to download, and recent attendance
  are all on one page.
- **Grades** and **Performance** name the student at the top, so it's always
  clear whose record is on screen.
- **Progress reports** — download the report cards filed for your children, and
  nobody else's. That restriction is enforced on the server.
- Messaging teachers, and notifications, as before.

An admin still has to link a parent to a child first; until then a parent has no
children to view. That's deliberate — it's what stops one family seeing another's
records.

## What is deliberately not built

**Fees and payments.** The template shipped a page with an invented balance,
invented transactions, and a payment button wired to nothing. Showing made-up
financial figures is worse than showing none, so that page now says fees are
handled by the school office and points people there. Real billing — invoices, a
payment provider, refunds, receipts, an audit trail — is a separate piece of work
and was never part of this build.

**Password-reset emails.** Creating a user sets a password an admin hands over;
there's no email provider configured, so nothing is sent automatically. Adding
one is small, but it needs an email service chosen and its credentials set.

## Notes on two client questions

**"When creating a class, what is the room? Is this where I assign the grade
level?"** — No. Room is the physical classroom (e.g. B12). Grade level is now its
own field, and it's what drives promotion between years. Both are labelled.

**"Attendance should only be calculated when at least one assignment has been
submitted."** — Applied to the *rate*: a student who hasn't handed anything in
shows "no work handed in" rather than 0%, because a zero there reads as terrible
attendance when it really means no data. Excused absences are left out of the
calculation; late still counts as attending.
