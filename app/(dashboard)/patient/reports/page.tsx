import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPatientReports } from "@/lib/services/appointment-service";
import { ReportVault } from "@/components/patient/ReportVault";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reports = await getPatientReports((session.user as any).id);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/80 mb-1">Secure Storage</div>
          <h1 className="text-4xl font-black tracking-tight">Report Vault</h1>
          <p className="text-sm text-muted-foreground/80 mt-1 max-w-md">
            Your laboratory results, radiology imaging, and digital prescriptions are stored securely here.
          </p>
        </div>
      </div>

      <ReportVault initialReports={reports} />
    </div>
  );
}

