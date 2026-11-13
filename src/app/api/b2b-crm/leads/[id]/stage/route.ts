import { NextRequest, NextResponse } from 'next/server';
import { updateLeadStage } from '@/lib/mock/b2bLeads';

const ALLOWED_STAGES = ['won', 'lost'] as const;
type AllowedStage = (typeof ALLOWED_STAGES)[number];

/** Marks a B2B lead won/lost in the in-memory store. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const stage = body?.stage as string | undefined;

  if (!stage || !ALLOWED_STAGES.includes(stage as AllowedStage)) {
    return NextResponse.json({ error: `stage must be one of: ${ALLOWED_STAGES.join(', ')}` }, { status: 400 });
  }

  const lead = updateLeadStage(id, stage);
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  }
  return NextResponse.json({ lead });
}
