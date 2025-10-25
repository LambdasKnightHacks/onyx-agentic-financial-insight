"use client"

import { Card } from "@/src/components/ui/card"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Bell, Shield, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and privacy settings</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Connected Accounts</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage your linked bank accounts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Chase Bank</p>
                <p className="text-sm text-muted-foreground">Last synced 2 minutes ago</p>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Wells Fargo</p>
                <p className="text-sm text-muted-foreground">Last synced 5 minutes ago</p>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              Add Account
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose how you want to be notified</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-alerts">Email Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive security alerts via email</p>
              </div>
              <Switch id="email-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="insights-digest">Weekly Insights Digest</Label>
                <p className="text-sm text-muted-foreground">Get a summary of your financial insights</p>
              </div>
              <Switch id="insights-digest" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="transaction-alerts">Large Transaction Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify me of transactions over $500</p>
              </div>
              <Switch id="transaction-alerts" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Privacy & Security</h2>
              <p className="text-sm text-muted-foreground mt-1">Control your data and security preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mask-numbers">Mask Account Numbers</Label>
                <p className="text-sm text-muted-foreground">Hide sensitive account information by default</p>
              </div>
              <Switch id="mask-numbers" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch id="two-factor" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
