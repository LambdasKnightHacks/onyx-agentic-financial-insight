import { NextResponse } from "next/server"
import { mockAutomationRules } from "@/lib/mock-data"

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 250))
  return NextResponse.json(mockAutomationRules)
}
