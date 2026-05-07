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
    case "ADMIN":
      redirect("/reception/dashboard");
    case "PATIENT":
    default:
      redirect("/patient/dashboard");
  }
}
