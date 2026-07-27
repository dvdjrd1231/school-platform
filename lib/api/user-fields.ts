import { z } from "zod"

/**
 * The contact details collected at enrolment, shared by the create and update
 * routes so both accept exactly the same shape.
 *
 * These are personal data about (often) a child, so they're deliberately narrow:
 * no free-form blob, everything length-capped, and nothing here is returned by
 * the list endpoints — only by the single-user read, which is already restricted
 * to the person themselves and to staff.
 */

export const addressSchema = z.object({
  line1: z.string().max(200).optional(),
  line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
})

export const guardianContactSchema = z.object({
  name: z.string().min(1).max(120),
  relationship: z.string().max(60).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal("")),
  isEmergencyContact: z.boolean().optional(),
})

export const contactFieldsSchema = {
  phone: z.string().max(40).optional(),
  dateOfBirth: z.coerce.date().optional(),
  address: addressSchema.optional(),
  guardianContacts: z.array(guardianContactSchema).max(10).optional(),
}
