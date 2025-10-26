"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card } from "@/src/components/ui/card";
import { OnyxIcon } from "@/src/components/logo";
import Link from "next/link";
import { signup } from "@/src/lib/auth-actions";
import { GL } from "@/src/components/gl";

export default function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");

    try {
      await signup(formData);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      <GL className="fixed inset-0 -z-10" />

      <div className="min-h-screen flex flex-col items-center justify-center p-2">
        <Link href="/" className="inline-flex items-center">
          <OnyxIcon size={250} className="text-primary-foreground" priority />
        </Link>
        <div className="w-full max-w-md space-y-5">
          <div className="text-center flex flex-col items-center "></div>

          <Card className="p-10 backdrop-blur-sm bg-card/80">
            {error && (
              <div className="mb-5 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <form action={handleSubmit} className="space-y-5">
              <h1 className="text-3xl font-bold tracking-tight">
                Create your account
              </h1>
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  name="first-name"
                  type="text"
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  name="last-name"
                  type="text"
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
