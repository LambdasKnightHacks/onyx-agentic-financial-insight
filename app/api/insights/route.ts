import { NextResponse } from "next/server"
import { mockInsights } from "@/lib/mock-data"

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  return NextResponse.json(mockInsights)
}
