import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign In - Maat K12",
  description: "Sign in to your Maat K12 account",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img src="/images/maat-k12-logo.png" alt="Maat K12 Logo" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Maat K12 account</p>
          </div>

          <SignInForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <a href="/help" className="text-emerald-600 hover:text-emerald-700">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
