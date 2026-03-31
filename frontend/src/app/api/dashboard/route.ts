import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/services/api";

export async function GET(request: NextRequest) {
  const response = await fetch(buildApiUrl("/dashboard"), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "application/json";
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  });
}
