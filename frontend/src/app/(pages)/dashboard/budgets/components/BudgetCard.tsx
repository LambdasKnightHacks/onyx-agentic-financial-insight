import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Edit2, Trash2, TrendingUp, Calendar, Tag, AlertTriangle } from "lucide-react"
import type { Budget } from "@/lib/types"
import type { BudgetSpending } from "../types"

interface BudgetCardProps {
  budget: Budget
  spending?: BudgetSpending
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
  onToggleActive: (budget: Budget) => void
}

export function BudgetCard({ budget, spending, onEdit, onDelete, onToggleActive }: BudgetCardProps) {
  const percentage = spending?.percentage || 0
  const spent = spending?.spent || 0
  const remaining = spending?.remaining || budget.cap_amount
  const isExceeded = spending?.is_exceeded || false

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      'day': 'day',
      'week': 'week',
      'month': 'month',
      'year': 'year'
    }
    return periodMap[period] || period
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isExceeded ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <DollarSign className={`h-5 w-5 ${isExceeded ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {budget.category}
                </h3>
                {budget.subcategory && (
                  <Badge variant="secondary">
                    {budget.subcategory}
                  </Badge>
                )}
                {budget.label && (
                  <Badge variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {budget.label}
                  </Badge>
                )}
                {isExceeded && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Over Budget
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {formatCurrency(budget.cap_amount, budget.currency)} / {formatPeriod(budget.period)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Starts {new Date(budget.start_on).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Spending Progress */}
          {spending && (
            <div className="pl-11 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={isExceeded ? 'text-destructive font-medium' : 'text-foreground'}>
                    {formatCurrency(spent, budget.currency)} spent
                  </span>
                  <span className="text-muted-foreground">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <span className={isExceeded ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  {isExceeded 
                    ? `${formatCurrency(Math.abs(remaining), budget.currency)} over` 
                    : `${formatCurrency(remaining, budget.currency)} left`
                  }
                </span>
              </div>
              <Progress 
                value={Math.min(percentage, 100)} 
                className={`h-2 ${isExceeded ? '[&>div]:bg-destructive' : ''}`}
              />
            </div>
          )}

          <div className="pl-11 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Priority: {budget.priority}</span>
            {budget.rollover && (
              <>
                <span>•</span>
                <span>Rollover enabled</span>
              </>
            )}
            {budget.created_at && (
              <>
                <span>•</span>
                <span>
                  Created {new Date(budget.created_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(budget)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Switch
            checked={budget.is_active}
            onCheckedChange={() => onToggleActive(budget)}
          />
        </div>
      </div>
    </Card>
  )
}

