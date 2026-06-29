import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCompanyById } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";
import { generateBriefIfNeeded } from "@/lib/llm/company-brief";
import { db } from "@/db";
import { companyBriefs } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUser();
  const company = await getCompanyById(id, user?.id);

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const brief = await generateBriefIfNeeded(id);

  return NextResponse.json({ company, brief });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "regenerate_brief") {
    const [existing] = await db
      .select()
      .from(companyBriefs)
      .where(eq(companyBriefs.companyId, id))
      .limit(1);

    if (existing) {
      await db.delete(companyBriefs).where(eq(companyBriefs.companyId, id));
    }

    const brief = await generateBriefIfNeeded(id);
    return NextResponse.json({ brief });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
