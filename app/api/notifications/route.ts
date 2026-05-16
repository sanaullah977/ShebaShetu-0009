import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const markReadSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: {
      userId: (session.user as any).id,
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: (session.user as any).id,
      isRead: false
    }
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = markReadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }

  const result = await prisma.notification.updateMany({
    where: {
      id: parsed.data.id,
      userId: (session.user as any).id
    },
    data: { isRead: true }
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
