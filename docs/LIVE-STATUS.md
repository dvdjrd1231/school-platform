# Where the platform stands

Updated 24 July 2026.

This is a plain-language rundown of what actually works against the live
database right now versus what's still a placeholder screen. I've grouped it by
who logs in, since that's usually the question — "what can a teacher/parent/etc.
actually do today?"

A quick note on wording: when I say something is "live," I mean it reads and
writes real data in MongoDB and respects who's allowed to do it. When I say
"placeholder," the screen is there and looks right, but it's still showing
sample content and isn't hooked up yet.

## The short version

The core of the school runs: people can register and be managed, teachers set
up courses and assignments, students submit, teachers grade, and everyone sees
the results — grades, GPA, trends, a skills report, and messaging between
parents and teachers that updates in real time. That covers all six things we
set out to build.

What's still sample data is the secondary stuff: quizzes, discussion boards, the
content library, the calendar, and a handful of the campus-portal info pages.
None of those were in the original scope; the screens came with the template.

## Things everyone gets, whatever their role

Signing in and out works with real accounts and hashed passwords. Where you land
after login depends on your role — admins go to the admin area, teachers to
their dashboard, students and parents to the campus home. The app also stops you
reaching pages you shouldn't: a student typing `/admin` into the URL just gets
sent back.

The header shows your real name and email, the notification bell shows your real
notifications (new assignment, a grade posted, a new message) and clears when you
read them, and the Messages area is fully working — you can start a conversation,
send and reply, and if the messaging keys are configured the other person sees it
without refreshing.

## Admin

Pretty much everything under the Admin menu is real:

- The dashboard shows live counts — how many students, teachers, courses,
  assignments, and how many submissions are waiting to be graded — plus a feed
  of recent activity.
- User Management lists real accounts and lets you create anyone (student,
  teacher, admin, parent) or deactivate them. You can also link a parent to their
  child here, which is what connects the two for messaging and progress reports.
- Class Management is the busiest screen: create a class, edit it, view its
  details, archive it, and manage its roster (enrol or remove students).
- Lesson Management and Grade Management are both live — the first lists and
  creates lessons across courses, the second is a school-wide gradebook of every
  graded submission with averages.
- Skills & Standards is where you define the grade-level standards students get
  assessed against.

You can also open any student's performance dashboard or skills report.

Two admin screens are still placeholders: the standalone Notifications page and
the Calendar. (The notification *bell* is real — it's just that separate admin
page that isn't wired.)

## Teacher

A teacher can create their own courses, post assignments (as a draft or
published — publishing pings the enrolled students), edit or remove them, and
grade what comes in, with feedback and automatic late penalties. They can record
skill proficiency for their students right on the skills report, look at any
student's performance, and message students, parents, and other staff.

One rough edge: enrolling students into a class works, but the button for it
currently lives on the admin Class Management screen, so a teacher doesn't yet
have their own roster control. The instructor landing page is also still a
placeholder, as are the quizzes, discussion, and content-authoring screens.

## Student

Students see the courses they're actually enrolled in, and their assignments with
the right status — not started, submitted, graded, overdue. They can write and
submit a response (and resubmit until it's graded, after which it locks and shows
the score and the teacher's feedback).

Their Performance page is real: overall grade, GPA, a trend line over time, and a
CSV export. The Skills Report shows their proficiency against grade-level
standards, read-only. Notifications and messaging to their teachers both work,
and anyone can self-register as a student from the sign-in page.

The one thing worth flagging: the old "Grades" overview page is still sample
data. The real grade information lives on the Performance page and on each
assignment instead, so nothing is missing — it's just that one legacy screen
hasn't been retired yet. Quizzes, discussions, and most of the campus-portal
sub-pages are also still placeholders; the Skills Report is the one campus page
that's fully live.

## Parent

A parent can see their own child's performance and skills report (read-only) and
message that child's teachers, with notifications along the way. The one setup
step is that an admin has to link the parent to the child first — until that
link exists, a parent has no children to view and no teachers to message. That's
deliberate: it's what stops one parent seeing another family's records.

There's no dedicated parent home page yet; parents work straight from
Performance, Skills, and Messages.

## Real-time messaging

Messaging and the live notification badge use Pusher. When the Pusher keys are
set on the server, messages and badges update instantly. When they're not, the
app quietly falls back to showing new messages on the next refresh — nothing
breaks either way.

## Against the original brief

Everything we agreed to build is live:

- student registration and management
- course and lesson management
- the assessment and grading workflow (assign → submit → grade → notify)
- performance tracking with charts, trends, and export
- parent–teacher messaging and notifications, in real time
- and the standards-based Skills Report the client asked about later, which is
  editable per grade level

The remaining placeholder areas — quizzes, discussions, the content library, the
calendar, and the extra campus info pages — are all beyond that original scope.
If any of them should become real, they're each their own small piece of work
and easy to pick off one at a time.
