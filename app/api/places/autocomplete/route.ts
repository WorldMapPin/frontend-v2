import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const GOOGLE_API_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { success, remaining, resetAt } = rateLimit(ip, 20, 60000);
  if (!success) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  let body: { input?: string; sessionToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, sessionToken } = body;
  if (!input || typeof input !== "string" || input.trim().length < 3) {
    return NextResponse.json(
      { error: "Input must be at least 3 characters" },
      { status: 400 },
    );
  }

  try {
    const googleBody: Record<string, string> = { input: input.trim() };
    if (sessionToken) {
      googleBody.sessionToken = sessionToken;
    }

    const response = await fetch(GOOGLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify(googleBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Places API request failed" },
        { status: 502 },
      );
    }

    const data = await response.json();

    const suggestions = (data.suggestions || [])
      .map((s: Record<string, unknown>) => s.placePrediction)
      .filter(Boolean)
      .slice(0, 5)
      .map(
        (p: {
          placeId?: string;
          place?: string;
          text?: { text?: string };
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
        }) => ({
          placeId: p.placeId || p.place?.replace("places/", ""),
          mainText: p.structuredFormat?.mainText?.text || p.text?.text || "",
          secondaryText: p.structuredFormat?.secondaryText?.text || "",
        }),
      );

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (err) {
    console.error("Places autocomplete proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
