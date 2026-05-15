import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFullQueue, getPendingCheckIns, getQueueMovements, getReceptionHospitalId } from "@/lib/services/reception-service";
import { QueueContent } from "./QueueContent";

export default async function ReceptionQueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const hospitalId = await getReceptionHospitalId((session.user as any).id);
  const [queue, pendingAppointments, movements] = await Promise.all([
    getFullQueue(hospitalId),
    getPendingCheckIns(hospitalId),
    getQueueMovements()
  ]);

  // Serialize to avoid hydration issues with Date objects
  const serializedQueue = JSON.parse(JSON.stringify(queue));
  const serializedPending = JSON.parse(JSON.stringify(pendingAppointments));
  const serializedMovements = JSON.parse(JSON.stringify(movements));

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <QueueContent 
        queue={serializedQueue} 
        pendingAppointments={serializedPending} 
        movements={serializedMovements}
      />
    </div>
  );
}
