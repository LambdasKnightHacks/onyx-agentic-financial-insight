import { NextResponse } from "next/server"
import { mockAgentTasks } from "@/src/lib/mock-data"

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return NextResponse.json(mockAgentTasks)
}
