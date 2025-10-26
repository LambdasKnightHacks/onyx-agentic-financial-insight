import Link from "next/link"
import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Mail } from "lucide-react"
import { OnyxIcon } from "@/src/components/logo"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <OnyxIcon size={28} className="text-primary-foreground" priority />
            </div>
            <span className="text-2xl font-bold">MyFinance</span>
          </Link>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-muted-foreground">
                We've sent you a confirmation link. Please check your email and click the link to activate your account.
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
