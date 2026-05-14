import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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

  const { id } = await req.json();

  await prisma.notification.update({
    where: {
      id,
      userId: (session.user as any).id
    },
    data: { isRead: true }
  });

  return NextResponse.json({ success: true });
}
