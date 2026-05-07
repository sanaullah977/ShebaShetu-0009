// Shared mock data for the ShebaSetu MVP — Bangladeshi names + realistic departments.
import { Activity, Baby, Bone, Brain, Ear, HeartPulse, Stethoscope, Eye } from "lucide-react";

export const DEPARTMENTS = [
  { id: "medicine", name: "Medicine", icon: Stethoscope },
  { id: "cardiology", name: "Cardiology", icon: HeartPulse },
  { id: "gynecology", name: "Gynecology", icon: Activity },
  { id: "orthopedics", name: "Orthopedics", icon: Bone },
  { id: "pediatrics", name: "Pediatrics", icon: Baby },
  { id: "ent", name: "ENT", icon: Ear },
  { id: "neurology", name: "Neurology", icon: Brain },
  { id: "ophthalmology", name: "Ophthalmology", icon: Eye },
];

export const DOCTORS = [
  { id: "d1", name: "Dr. Anika Rahman", dept: "medicine", chamber: "Room 204", rating: 4.9 },
  { id: "d2", name: "Dr. Tanvir Hossain", dept: "cardiology", chamber: "Room 312", rating: 4.8 },
  { id: "d3", name: "Dr. Fahmida Akter", dept: "gynecology", chamber: "Room 118", rating: 4.9 },
  { id: "d4", name: "Dr. Mahbub Chowdhury", dept: "orthopedics", chamber: "Room 220", rating: 4.7 },
  { id: "d5", name: "Dr. Rezwana Karim", dept: "pediatrics", chamber: "Room 105", rating: 4.9 },
  { id: "d6", name: "Dr. Imran Siddique", dept: "ent", chamber: "Room 308", rating: 4.6 },
];

export const QUEUE_AHEAD = [
  { token: "A-21", initials: "M.R.", reason: "Follow-up", waited: "12m" },
  { token: "A-22", initials: "S.A.", reason: "Chest pain", waited: "9m" },
  { token: "A-23", initials: "T.H.", reason: "BP check", waited: "6m" },
];

export const APPOINTMENTS = [
  {
    id: "ap1",
    token: "A-24",
    doctor: "Dr. Anika Rahman",
    dept: "Medicine",
    date: "Today",
    time: "11:40 AM",
    status: "live",
  },
  {
    id: "ap2",
    token: "B-08",
    doctor: "Dr. Tanvir Hossain",
    dept: "Cardiology",
    date: "Mon, 22 Apr",
    time: "4:15 PM",
    status: "upcoming",
  },
  {
    id: "ap3",
    token: "C-12",
    doctor: "Dr. Rezwana Karim",
    dept: "Pediatrics",
    date: "Wed, 02 Apr",
    time: "9:30 AM",
    status: "completed",
  },
];

export const REPORTS = [
  { id: "r1", name: "CBC_Report_Mar2025.pdf", size: "412 KB", type: "pdf" },
  { id: "r2", name: "ECG_Scan.jpg", size: "1.2 MB", type: "image" },
  { id: "r3", name: "Prescription_DrAnika.pdf", size: "208 KB", type: "pdf" },
];

export const TIME_SLOTS = [
  "9:00 AM", "9:20 AM", "9:40 AM", "10:00 AM",
  "10:20 AM", "10:40 AM", "11:00 AM", "11:20 AM",
  "11:40 AM", "12:00 PM", "2:00 PM", "2:20 PM",
  "2:40 PM", "3:00 PM", "3:20 PM", "3:40 PM",
];
