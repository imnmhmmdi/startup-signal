import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { savedCompanies } from "@/db/schema";
import { getUser } from "@/lib/supabase/server";
import { queryCompanies } from "@/lib/queries/companies";
import { formatDatabaseConnectionError } from "@/lib/db/validate-config";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await queryCompanies({
      userId: user.id,
      savedOnly: true,
      sortBy: "pmFitScore",
      sortOrder: "desc",
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("[api/saved] GET failed:", error);
    return NextResponse.json(
      { error: formatDatabaseConnectionError(error) },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId, notes, status } = await request.json();

  const [saved] = await db
    .insert(savedCompanies)
    .values({
      userId: user.id,
      companyId,
      notes: notes ?? "",
      status: status ?? "new",
    })
    .onConflictDoUpdate({
      target: [savedCompanies.userId, savedCompanies.companyId],
      set: {
        notes: notes ?? "",
        status: status ?? "new",
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json({ saved });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId, notes, status } = await request.json();

  const [updated] = await db
    .update(savedCompanies)
    .set({
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(savedCompanies.userId, user.id),
        eq(savedCompanies.companyId, companyId)
      )
    )
    .returning();

  return NextResponse.json({ saved: updated });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await request.json();

  await db
    .delete(savedCompanies)
    .where(
      and(
        eq(savedCompanies.userId, user.id),
        eq(savedCompanies.companyId, companyId)
      )
    );

  return NextResponse.json({ success: true });
}
