# Client feedback — what was done

The client's review of 24 Jul 2026 has been worked through in full. This document
was originally a triage plan; it's now the record of what happened to each item.

Everything below is **done and on the live database** unless marked otherwise.
Two items are deliberately not built and are called out at the end.

---

## Their questions, answered

| Question | Answer |
|---|---|
| How are announcements posted? | "New announcement" on the Announcements page, or from the classroom tab. School-wide or per class, with an audience and a priority. |
| How do I edit a course already created? | Class Management › Edit. Everything except the course code, including the teacher. |
| Open course is blank | It was reading sample data. It now loads the real course. |
| Content dropdown doesn't show my new course | The dropdown was hard-coded sample data, duplicated per screen. There is now one shared live course list. |
| Where are quizzes created? | The Quizzes page — "Create quiz". Practice problems are created from inside a lesson. |
| How do I change someone's role? | User Management › Edit user. Role, status, password, and role-specific fields. |
| Why "temporary password"? Does it email a reset? | It didn't, and the label was misleading. Nothing is emailed — see *Not built* below. |
| When creating a class, what is the room? Is that the grade level? | No. Room is the physical classroom; grade level is now its own field and drives promotion. |
| How do I know whose grades I'm looking at as a parent? | The student is named in a banner at the top, and the switcher stays visible. |
| What are groups? How are they created? | Working groups inside a class — a teacher can split a class into them, or students can start their own. The 404 was a nav link pointing at a route that didn't exist. |
| What exactly is Class List viewing and managing? | The roster: everyone enrolled, with details, progress link, messaging and CSV export. |
| How is attendance taken and where is it viewed? | Admin › Attendance: a register per class per day, and a running record per student. |
| How do I upload to the digital library? Is material assigned to lessons? | Teachers and admins upload; students read. Lesson materials attach to the lesson itself. |
| What does "interactive" mean on a lesson? | A lesson type. Interactive lessons carry practice problems answered on the platform. |

## Buttons that did nothing — now working

Announcement reply · new discussion · post reply · edit/delete discussion ·
add calendar event (classroom, school and admin) · play video · complete a
lesson (and unlock the next) · view quiz results · e-portfolio add item ·
My Media upload/view/download/delete · class gallery upload/preview/download ·
digital library upload and preview · create survey · submit a survey ·
"Tutor" (the tab was blank because the route didn't exist) · help-desk ticket
(it logged to the console and claimed success; it now messages administrators).

## Extensions asked for

- **Edit any user, change roles** — done.
- **Reassign a class's teacher** — done, admin-only, enforced server-side.
- **Delete a class** — done; refused while it still has students or lessons, with
  a message saying how many of each.
- **Edit / delete / reassign a lesson** — done, including moving it to another
  class (completion marks for it are cleared so nobody's progress is inflated).
- **Lesson order** — shown explicitly, and lessons run in module order then
  lesson order.
- **Confirmation before deleting anything** — done, via one shared dialog. The
  irreversible ones (deleting a class, a quiz with attempts, promoting a student)
  additionally require typing to confirm.
- **Back button returns to the previous page** — done.
- **Clickable references** — class progress and the class list link through to
  the course and to each student's progress summary.

## New subsystems built

- **Quiz/test engine** — five question types, automatic marking for four of
  them, teacher marking for essays, attempts, time limits, results. Marking
  happens server-side and the answer key never reaches the browser.
- **Attendance** — register, record, and the client's rule that a rate only
  counts once a student has handed something in.
- **Report cards / progress reports** — teacher uploads per student per term;
  the student and their linked guardians can download, and nobody else.
- **Grade promotion** — closes the old grade's classes, opens the new grade's
  active ones, with a dry run then two further confirmations.
- **Categories/subcategories** — admin-editable, any depth, applied across media,
  library, portfolio and seminars.
- **File storage** — GridFS in the existing MongoDB, so no new service to run.
  Whitelisted types, 50 MB cap, access decided in one place.
- **Profile photos** — upload, replace, remove.
- **Enrolment details** — phone, address, parent/guardian and emergency contacts.
- **Parent multi-student switcher** — the /family page, remembered between visits.
- **Groups**, **surveys**, **private notes** — all new.

## Not built, deliberately

**Fees and payments.** The template's page showed an invented balance and
invented transactions behind a payment button wired to nothing. Fabricated
financial figures are worse than an empty screen, and there is no billing
subsystem to replace them with. The page now states that fees are handled by the
school office. Real billing — invoices, a payment provider, refunds, receipts,
an audit trail — is its own project.

**Password-reset emails.** Nothing is emailed today; an admin sets a password and
hands it over. Wiring this up is small work, but it needs an email provider
chosen and its credentials configured on the server.

## Where the mock data went

`lib/database.ts` and the test-data viewer have been deleted. Nothing imports
them, and keeping them around would only invite a screen to quietly go back to
sample content.
