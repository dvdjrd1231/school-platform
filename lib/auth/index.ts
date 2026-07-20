import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { authConfig } from "./config"
import { connectDB } from "@/lib/db/connect"
import { User } from "@/lib/models"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        await connectDB()

        // passwordHash is select:false on the schema, so request it explicitly.
        const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash")

        // Return null for every failure case without distinguishing between
        // "no such user" and "wrong password" — telling them apart lets an
        // attacker enumerate valid accounts.
        if (!user || user.status !== "active") return null

        const valid = await user.comparePassword(password)
        if (!valid) return null

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar ?? null,
          roles: user.roles,
        }
      },
    }),
  ],
})
