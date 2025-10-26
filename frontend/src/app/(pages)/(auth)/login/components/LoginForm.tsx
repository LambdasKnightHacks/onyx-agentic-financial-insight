// components/LoginForm.tsx
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { login } from "@/src/lib/auth-actions"
import SignInWithGoogleButton from "./SignInWithGoogleButton"
import { GL } from '@/src/components/gl'
import { OnyxIcon } from "@/src/components/logo"


export default function LoginForm() {
  return (
    <>
      <GL className="fixed inset-0 -z-10" />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
        <Link href="/" className="flex items-center justify-center">
          <OnyxIcon size={300} className="text-primary" />
        </Link>

        <Card className="mx-auto max-w-sm backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="your_email@example.com" required />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className=" pl-20 ml-auto inline-block text-sm underline">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" required />
                </div>

                <Button type="submit" formAction={login} className="w-full">
                  Login
                </Button>

                <SignInWithGoogleButton />
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
