// Importing this module registers every schema with Mongoose. Route handlers
// that use .populate() need the referenced models registered, which fails
// silently-then-loudly ("Schema hasn't been registered") if only some are
// imported. Import from here rather than reaching into individual files.

export { User, USER_ROLES, hashPassword, type IUser, type UserRole } from "./User"
export { Course, type ICourse, type IModule, type ILessonItem } from "./Course"
export { Enrollment, type IEnrollment } from "./Enrollment"
export { Assignment, type IAssignment } from "./Assignment"
export { Submission, type ISubmission } from "./Submission"
export { Conversation, type IConversation } from "./Conversation"
export { Message, type IMessage } from "./Message"
export { Notification, type INotification } from "./Notification"
