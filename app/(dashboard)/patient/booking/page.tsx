import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookAppointment } from "@/app/actions/appointments";
import { CalendarDays, Clock, MapPin, UserRound } from "lucide-react";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { dept } = await searchParams;

  // Fetch real data from DB
  const departments = await prisma.department.findMany({
    include: {
      doctors: {
        include: {
          user: true
        }
      }
    }
  });

  // Flat list of doctors
  const doctors = departments.flatMap(d => d.doctors.map(doc => ({
    id: doc.id,
    name: doc.user.name,
    specialization: doc.specialization,
    departmentId: d.id,
    departmentName: d.name
  })));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Book an Appointment</h1>
        <p className="text-muted-foreground mt-2">
          Secure your slot in seconds. No more waiting in lines.
        </p>
      </div>

      <form action={bookAppointment}>
        <GlassCard className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Select Department</Label>
              <Select name="departmentId" defaultValue={departments.find(d => d.name === dept)?.id}>
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Doctor</Label>
              <Select name="doctorId">
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Choose doctor" />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Preferred Date & Time</Label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  name="scheduledAt"
                  className="glass pl-10"
                  required
                />
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visit Reason / Symptoms</Label>
              <Textarea
                name="symptoms"
                placeholder="Briefly describe why you are visiting..."
                className="glass min-h-[42px]"
              />
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Clock className="h-4 w-4" /> Instant Digital Token
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By booking, you'll receive a digital token. You'll be notified of your exact 
                live position in the queue once you arrive at the hospital.
              </p>
            </div>

            <Button type="submit" className="w-full bg-gradient-emerald text-primary-foreground h-12 text-lg font-bold shadow-glow">
              Confirm & Book Appointment
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
