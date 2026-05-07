// Mock queue + schedule data for Reception & Doctor roles
export type QueueStatus = "waiting" | "called" | "completed" | "delayed" | "absent";

export interface QueueEntry {
  id: string;
  token: string;
  name: string;
  phone: string;
  reason: string;
  dept: string;
  doctor: string;
  aiDept?: string;
  arrived: string;
  status: QueueStatus;
  hasReports?: boolean;
}

export const QUEUE_ENTRIES: QueueEntry[] = [
  { id: "q1",  token: "A-24", name: "Rakib Hasan",       phone: "+8801711-234567", reason: "Chest discomfort, palpitations", dept: "Cardiology", doctor: "Dr. Tanvir Hossain", aiDept: "Cardiology", arrived: "10:42 AM", status: "called",    hasReports: true },
  { id: "q2",  token: "A-25", name: "Sumaiya Akter",     phone: "+8801812-998877", reason: "Fever and sore throat for 3 days", dept: "Medicine",   doctor: "Dr. Anika Rahman",   aiDept: "Medicine",   arrived: "10:48 AM", status: "waiting" },
  { id: "q3",  token: "A-26", name: "Mizanur Rahman",    phone: "+8801912-445566", reason: "Knee pain after fall",            dept: "Orthopedics",doctor: "Dr. Mahbub Chowdhury", aiDept: "Orthopedics", arrived: "10:55 AM", status: "waiting", hasReports: true },
  { id: "q4",  token: "A-27", name: "Tahmina Begum",     phone: "+8801511-223344", reason: "Pregnancy check-up, week 22",     dept: "Gynecology", doctor: "Dr. Fahmida Akter",  aiDept: "Gynecology", arrived: "11:02 AM", status: "waiting" },
  { id: "q5",  token: "A-28", name: "Arif Mahmud",       phone: "+8801711-001122", reason: "Persistent ear infection",        dept: "ENT",        doctor: "Dr. Imran Siddique", aiDept: "ENT",        arrived: "11:08 AM", status: "delayed" },
  { id: "q6",  token: "A-29", name: "Nusrat Jahan",      phone: "+8801611-778899", reason: "Child fever 39°C, cough",         dept: "Pediatrics", doctor: "Dr. Rezwana Karim",  aiDept: "Pediatrics", arrived: "11:14 AM", status: "waiting", hasReports: true },
  { id: "q7",  token: "A-30", name: "Shahidul Islam",    phone: "+8801911-556677", reason: "Hypertension follow-up",          dept: "Medicine",   doctor: "Dr. Anika Rahman",   aiDept: "Cardiology", arrived: "11:20 AM", status: "waiting" },
  { id: "q8",  token: "A-21", name: "Farhana Yasmin",    phone: "+8801711-665544", reason: "Routine BP check",                dept: "Medicine",   doctor: "Dr. Anika Rahman",   arrived: "10:10 AM", status: "completed" },
  { id: "q9",  token: "A-22", name: "Habibur Rahman",    phone: "+8801511-998800", reason: "Diabetes review",                 dept: "Medicine",   doctor: "Dr. Anika Rahman",   arrived: "10:18 AM", status: "completed" },
  { id: "q10", token: "A-23", name: "Sadia Chowdhury",   phone: "+8801811-220033", reason: "Post-op suture removal",          dept: "Orthopedics",doctor: "Dr. Mahbub Chowdhury", arrived: "10:30 AM", status: "completed" },
  { id: "q11", token: "A-31", name: "Imran Khan",        phone: "+8801911-334455", reason: "Migraine, light sensitivity",     dept: "Medicine",   doctor: "Dr. Anika Rahman",   aiDept: "Neurology",  arrived: "11:26 AM", status: "absent" },
];

// Doctor schedule: 7-day grid of 30-min slots
export const SCHEDULE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SCHEDULE_SLOTS = [
  "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "2:00", "2:30", "3:00", "3:30", "4:00", "4:30",
];

// Default availability map (true = open)
export const DEFAULT_AVAILABILITY: Record<string, boolean> = (() => {
  const map: Record<string, boolean> = {};
  SCHEDULE_DAYS.forEach((d) => {
    SCHEDULE_SLOTS.forEach((s) => {
      // Friday afternoon off, lunch break
      const off = (d === "Fri" && parseInt(s) >= 12) || s === "12:00";
      map[`${d}-${s}`] = !off;
    });
  });
  return map;
})();
