import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const workflow = req.nextUrl.searchParams.get("workflow");
  if (!workflow || !/^w[0-6]$/.test(workflow)) {
    return NextResponse.json({ error: "Specify ?workflow=w0 through w6" }, { status: 400 });
  }

  // Build internal URL to the cron route
  const baseUrl = req.nextUrl.origin;
  const cronUrl = `${baseUrl}/api/cron/${workflow}`;

  const res = await fetch(cronUrl, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  const data = await res.json();
  return NextResponse.json({ workflow, status: res.status, result: data });
}
