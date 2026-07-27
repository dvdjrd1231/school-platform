# Client feedback — triage and plan

The client's review (24 Jul 2026) is a large list. It splits into three very
different kinds of work, and it matters to keep them apart when scoping/quoting:

- **A. Wire-ups & fixes** — a screen exists but a button does nothing, because
  that module was never connected. Small each; there are many.
- **B. Extensions** — building on things already live (edit a user's role,
  reassign a teacher, delete a class). Small–medium.
- **C. New features** — genuinely new subsystems that were not in the original
  scope (attendance, report cards, grade promotion, categories, a quiz engine,
  digital-library uploads, profile photos, collecting enrollment PII, groups).
  Medium–large; these should be quoted as new work.

Original scope (all delivered): registration & user management, course/lesson
management, assignment→submit→grade workflow, performance tracking, parent–teacher
messaging + notifications, plus the Skills Report added mid-project. Almost
everything below is **beyond** that scope.

---

## B. Extensions — doing these first (small, high-value, answers the loudest questions)

- [ ] **Change a user's role / edit any user** — Edit dialog in User Management
      (name, email, role, status, role fields). *Answers: "how do I change role",
      "edit all roles".*
- [ ] **Reassign a class's teacher** — allow admin to change instructor on class
      edit. *Answers: "unable to switch teachers", "how to assign teacher".*
- [ ] **Delete a class** — hard delete when the class has no students/lessons,
      otherwise block with a clear message; with confirmation. *Answers: "need a
      delete button for classes".*
- [ ] **Edit / delete / reassign a lesson** — extend Lesson Management.
- [ ] **Confirmation before any delete** — shared confirm dialog, applied
      everywhere destructive.

## A. Wire-ups & fixes — existing screens that aren't connected

Each is "the screen is a placeholder; make it real":

- [ ] Announcements — post/read (needs a small model + API + UI)
- [ ] Course detail page ("Open course" is blank; content dropdown empty) — wire
      to the real course + modules
- [ ] Discussions — new discussion, reply, edit/delete
- [ ] Classroom calendar / global calendar — add event
- [ ] Quizzes — "view results", and see note in C (creation is a new engine)
- [ ] E-portfolio — add item
- [ ] My Media / Class Media Gallery — upload, view, download, delete (needs file
      storage — see note)
- [ ] Digital Library — upload, preview, assign to lessons
- [ ] Surveys — create + assign (button dead today)
- [ ] Tutor / Help — blank
- [ ] Groups — 404, undefined feature; needs definition before building
- [ ] "Play video" / interactive lesson steps / lesson completion unlock
- [ ] Back button returns to the previous page

## C. New features — quote as new work

- [ ] **Attendance** — capture + view; client wants it tied to submissions.
      New model, entry UI, reporting.
- [ ] **Report cards / progress reports** — teacher uploads per quarter; parent
      downloads. New model + file storage + two UIs.
- [ ] **Grade-level promotion** — promote a student, revoke old-grade course
      access, grant new; triple-confirmation. Touches enrollment + access rules.
- [ ] **Categories/subcategories** (grade → subject → unit → lesson) for media,
      library, portfolio, seminar; admin-editable taxonomy.
- [ ] **Quiz/test engine** — author questions, students answer on-platform,
      auto or manual grading. This is a whole module.
- [ ] **Profile photos** — upload + edit, per user. Needs file storage.
- [ ] **Enrollment PII** — phone, address, parents' names & contacts on the
      student record; new fields + forms + privacy considerations.
- [ ] **Parent multi-student switcher** — pick between children (partly there:
      the data model already supports multiple children).
- [ ] **Password reset emails** — "temporary password" should trigger a reset
      email; needs an email provider.

### Cross-cutting dependency: file storage
Media upload, library, portfolio, report cards, and profile photos all need
somewhere to put files (e.g. S3 / Cloudflare R2 / UploadThing). That's a
one-time setup decision that unblocks a whole column of items at once.

---

## Suggested order

1. **B (extensions)** — quick, answers the recurring admin questions. *(in progress)*
2. **A (wire-ups)** that need no file storage — announcements, course detail,
   discussions, calendar events, confirmations, back button.
3. **File-storage decision**, then the upload-dependent items (media, library,
   portfolio, report cards, profile photos).
4. **C (new subsystems)** — attendance, quiz engine, promotion, categories —
   each scoped and quoted on its own.
