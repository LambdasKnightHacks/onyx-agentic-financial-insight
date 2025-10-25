"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Lightbulb, ArrowRight } from "lucide-react"
import type { Insight } from "@/lib/types"

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

  // Calculate summary metrics
  const highConfidenceInsights = insights.filter((i) => i.confidence > 0.8)
  const totalPotentialSavings = insights
    .filter((i) => i.cta?.params?.amount)
    .reduce((sum, i) => sum + (i.cta?.params?.amount || 0), 0)

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
                Based on your recent spending patterns and account activity, here's what you should focus on:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed">
              You have{" "}
              <strong className="text-primary">{highConfidenceInsights.length} high-priority recommendations</strong>{" "}
              that could help optimize your finances. Your dining expenses are trending{" "}
              {insights.find((i) => i.title.includes("dining"))?.metricDelta &&
              insights.find((i) => i.title.includes("dining"))!.metricDelta > 0
                ? "higher"
                : "lower"}{" "}
              than usual, and we've identified potential savings of{" "}
              <strong className="text-success">${totalPotentialSavings.toFixed(2)}</strong> per month through
              subscription optimization and fee reduction.
            </p>
            <p className="text-foreground leading-relaxed">
              Consider setting up automated budgets for your top spending categories and reviewing your recurring
              subscriptions. Small adjustments now can lead to significant savings over time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="gap-1.5">
              <Target className="h-3 w-3" />
              {insights.length} Total Insights
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <DollarSign className="h-3 w-3" />${totalPotentialSavings.toFixed(0)}/mo Potential Savings
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Calendar className="h-3 w-3" />
              Updated Today
            </Badge>
          </div>
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
              {/* Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
                </div>
                <Progress value={insight.confidence * 100} className="h-2" />
              </div>

              {/* Why */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Why you're seeing this:</p>
                <ul className="space-y-1">
                  {insight.why.map((reason, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

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
