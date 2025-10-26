import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Financial Summary API is running",
    backend_url: BACKEND_URL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(
      "Calling backend:",
      `${BACKEND_URL}/api/financial-summary/generate`
    );
    console.log("Request body:", body);

    const response = await fetch(
      `${BACKEND_URL}/api/financial-summary/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Backend error:", response.status, text);
      return NextResponse.json(
        {
          error: `Backend returned ${response.status}: ${text.substring(
            0,
            100
          )}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Backend response:", data.status);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch financial summary: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
