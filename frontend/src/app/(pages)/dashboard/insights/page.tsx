"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Skeleton } from "@/src/components/ui/skeleton"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { TrendingUp, TrendingDown, Calendar, Target, Lightbulb, ArrowRight } from "lucide-react"
import type { Insight } from "@/src/lib/types"

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((data) => {
        setInsights(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Failed to load insights: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Generate simple summary
  const generateSummary = () => {
    if (insights.length === 0) {
      return {
        primary: "You don't have any insights yet. As you connect accounts and make transactions, our AI agents will analyze your spending patterns and provide personalized recommendations.",
        secondary: "Connect a bank account to get started with AI-powered financial insights and recommendations."
      }
    }

    return {
      primary: `You have <strong class="text-primary">${insights.length} insight${insights.length === 1 ? '' : 's'}</strong> based on your recent activity.`,
      secondary: `Focus on managing your expenses to stay on track with your financial goals.`
    }
  }

  const summary = generateSummary()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-1">AI-powered recommendations to help you manage your finances better</p>
      </div>

      {/* Summary Box */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Your Financial Summary</CardTitle>
              <CardDescription className="mt-1.5 text-base leading-relaxed">
                {insights.length > 0 
                  ? "Based on your recent spending patterns and account activity, here's what you should focus on:"
                  : "Get started with AI-powered financial insights"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: summary.primary }} />
            <p className="text-foreground leading-relaxed">{summary.secondary}</p>
          </div>
          {insights.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="gap-1.5">
                <Target className="h-3 w-3" />
                {insights.length} Total Insights
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Calendar className="h-3 w-3" />
                Updated Today
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={insight.metricDelta > 0 ? "destructive" : "default"} className="gap-1">
                      {insight.metricDelta > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(insight.metricDelta * 100).toFixed(0)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">vs 3-month avg</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CTA */}
              {insight.cta && (
                <Button className="w-full gap-2" variant="default">
                  {insight.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {insights.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-muted">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No insights yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're analyzing your spending patterns. Check back soon for personalized recommendations.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
