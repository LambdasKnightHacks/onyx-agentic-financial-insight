"use client"

import { useEffect, useState } from "react"
import { Card } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import { Skeleton } from "@/src/components/ui/skeleton"
import { Zap, Plus } from "lucide-react"
import type { AutomationRule } from "@/src/lib/types"

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch("/api/automations")
        const data = await res.json()
        setRules(data)
      } catch (error) {
        console.error("Failed to fetch rules:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [])

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/automations${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      setRules(rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r)))
    } catch (error) {
      console.error("Failed to toggle rule:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground mt-2">Set up rules to automatically manage your transactions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {rule.trigger.type === "transaction_created" ? "When transaction is created" : rule.trigger.type}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rule.trigger.conditions.map((c, i) => (
                        <span key={i}>
                          {c.field} {c.op} {c.value}
                          {i < rule.trigger.conditions.length - 1 && " and "}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="pl-11">
                  <p className="text-sm font-medium mb-2">Then:</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.actions.map((action, i) => (
                      <Badge key={i} variant="secondary">
                        {action.type.replace(/_/g, " ")}
                        {action.severity && ` (${action.severity})`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pl-11 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created by {rule.createdBy}</span>
                  <span>•</span>
                  <span>Version {rule.version}</span>
                </div>
              </div>

              <Switch checked={rule.enabled} onCheckedChange={(checked) => toggleRule(rule.id, checked)} />
            </div>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex p-3 rounded-full bg-muted mb-4">
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
          <p className="text-muted-foreground mb-4">Create your first rule to automate transaction management</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </Card>
      )}
    </div>
  )
}
