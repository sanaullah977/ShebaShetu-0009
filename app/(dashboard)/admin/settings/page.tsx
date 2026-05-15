import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/unauthorized");

  const userId = (session.user as any).id;
  const [user, preferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
      },
    }),
    prisma.userPreference.findUnique({ where: { userId } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences and password.
        </p>
      </div>

      <SettingsForm
        user={user as any}
        preferences={{
          emailAlerts: preferences?.emailAlerts ?? true,
          queueUpdates: preferences?.queueUpdates ?? true,
        }}
      />
    </div>
  );
}
