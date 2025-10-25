import { NextResponse } from "next/server"
import { mockFraudAlerts } from "@/lib/mock-data"

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return NextResponse.json(mockFraudAlerts)
}
