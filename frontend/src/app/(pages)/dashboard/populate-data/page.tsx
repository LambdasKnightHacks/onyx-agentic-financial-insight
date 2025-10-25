"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Database, Users, CreditCard, AlertTriangle, Lightbulb, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/src/components/auth-context"

export default function PopulateDataPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const populateMockData = async () => {
    if (!user) {
      setError("You must be logged in to populate data")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/populate-mock-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to populate data')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearData = async () => {
    if (!user) {
      setError("You must be logged in to clear data")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/clear-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear data')
      }

      setResult({ success: true, message: 'Data cleared successfully' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Populate Mock Data</h1>
        <p className="text-muted-foreground mt-1">Add sample data to your database for testing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Populate Mock Data
          </CardTitle>
          <CardDescription>
            Add sample accounts, transactions, insights, and alerts to your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>4 Sample Accounts</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" />
              <span>8 Sample Transactions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>4 Financial Insights</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>3 Fraud Alerts</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={populateMockData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Populating..." : "Populate Mock Data"}
            </Button>
            
            <Button 
              onClick={clearData} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 mb-4">{result.message}</p>
            {result.data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{result.data.accounts}</div>
                  <div className="text-sm text-muted-foreground">Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{result.data.transactions}</div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{result.data.insights}</div>
                  <div className="text-sm text-muted-foreground">Insights</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{result.data.alerts}</div>
                  <div className="text-sm text-muted-foreground">Alerts</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            After populating data, you can:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• View transactions in the <a href="/dashboard/transactions" className="text-primary hover:underline">Transactions page</a></li>
            <li>• Check insights in the <a href="/dashboard/insights" className="text-primary hover:underline">Insights page</a></li>
            <li>• Review alerts in the <a href="/dashboard/alerts" className="text-primary hover:underline">Alerts page</a></li>
            <li>• See account balances on the <a href="/dashboard" className="text-primary hover:underline">Dashboard</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
