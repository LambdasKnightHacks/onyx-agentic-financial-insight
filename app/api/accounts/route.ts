import { NextResponse } from "next/server"
import { mockAccounts } from "@/lib/mock-data"

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return NextResponse.json(mockAccounts)
}
