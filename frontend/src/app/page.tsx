import { Button } from "@/src/components/ui/button";
import { ArrowRight, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { OnyxIcon } from "@/src/components/logo";
import { GL } from '@/src/components/gl'

export default function LandingPage() {
  return (
    <>
    <GL className= "fixed inset-0 -z-10" />
    <div className="min-h-screen flex flex-col ">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
              <OnyxIcon size={250} className="text-primary-foreground pt-5" priority />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center w-full">
        <div className="container px-4 md:px-8 mx-auto w-full">
          <div className="mx-auto max-w-4xl py-12 md:py-20">
            <div className="text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm">
                <span className="text-muted-foreground">
                  AI-powered financial insights
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                  Your money,
                  <br />
                  <span className="text-primary">simplified</span>
                </h1>
                <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                  Track spending, detect fraud, and get personalized
                  insights—all in one calm, intelligent dashboard.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base"
                  asChild
                >
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base bg-transparent"
                  asChild
                >
                  <Link href="/login">Log In</Link>
                </Button>
              </div>

              {/* Features Grid */}
              <div className="grid gap-6 pt-16 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Smart Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered recommendations help you save money and optimize
                    spending patterns.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    Fraud Detection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time alerts protect your accounts from suspicious
                    activity and unauthorized charges.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <OnyxIcon size={32} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Automation</h3>
                  <p className="text-sm text-muted-foreground">
                    Set rules to automatically categorize transactions and
                    trigger actions based on your preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 w-full">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2025 MyFinance. Built with v0.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
