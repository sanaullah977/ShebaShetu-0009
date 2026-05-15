import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function PatientSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;
  
  const [user, preferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, name: true, email: true, phone: true, image: true, role: true,
        patientProfile: true
      }
    }),
    prisma.userPreference.findUnique({
      where: { userId }
    })
  ]);

  if (!user) redirect("/login");

  const safePreferences = {
    emailAlerts: preferences?.emailAlerts ?? true,
    queueUpdates: preferences?.queueUpdates ?? true,
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div>
        <div className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/80 mb-1">Account</div>
        <h1 className="text-4xl font-black tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Manage your personal information, security preferences, and notification settings.
        </p>
      </div>

      <SettingsForm 
        user={user as any} 
        preferences={safePreferences} 
      />
    </div>
  );
}
