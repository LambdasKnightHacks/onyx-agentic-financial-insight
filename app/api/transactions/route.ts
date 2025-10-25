import { NextResponse } from "next/server"
import { mockTransactions } from "@/lib/mock-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get("accountId")
  const suspicious = searchParams.get("suspicious")

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  let filtered = mockTransactions

  if (accountId) {
    filtered = filtered.filter((t) => t.accountId === accountId)
  }

  if (suspicious === "true") {
    filtered = filtered.filter((t) => t.agent.fraudScore > 0.5)
  }

  return NextResponse.json(filtered)
}
