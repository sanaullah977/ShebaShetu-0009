import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = (session.user as any).role || "PATIENT";

  switch (role) {
    case "DOCTOR":
      redirect("/doctor/dashboard");
    case "RECEPTION":
      redirect("/reception/dashboard");
    case "ADMIN":
    case "SUPER_ADMIN":
      redirect("/admin/support");
    case "PATIENT":
    default:
      redirect("/patient/dashboard");
  }
}
