// components/LoginForm.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth-actions";
import SignInWithGoogleButton from "./SignInWithGoogleButton";
import { GL } from "@/components/gl";
import { OnyxIcon } from "@/components/logo";

export default function LoginForm() {
  return (
    <>
      <GL className="fixed inset-0 -z-10" />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
        <Link href="/" className="flex items-center justify-center">
          <OnyxIcon size={300} className="text-primary" />
        </Link>

        <Card className="mx-auto w-full max-w-lg backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your_email@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                  <Link
                    href="#"
                    className=" pl-20 ml-auto inline-block text-sm text-[#58ABFA]"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button type="submit" formAction={login} className="w-full">
                  Login
                </Button>

                <SignInWithGoogleButton />
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className=" text-[#58ABFA]">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
