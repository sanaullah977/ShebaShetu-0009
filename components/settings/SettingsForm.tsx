"use client"

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Shield, Bell, Loader2, Camera, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile, updatePreferences, updatePassword } from "@/app/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;

type SettingsUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  image?: string | null;
  role?: "PATIENT" | "DOCTOR" | "RECEPTION" | "ADMIN" | "SUPER_ADMIN";
  doctorProfile?: {
    specialization: string | null;
    consultationFee: number | null;
    roomNumber?: string | null;
  } | null;
  patientProfile?: {
    age?: number | null;
    gender?: string | null;
    bloodGroup?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
  } | null;
  receptionProfile?: unknown;
};

interface SettingsFormProps {
  user: SettingsUser;
  preferences: {
    emailAlerts: boolean;
    queueUpdates: boolean;
  };
}

type ProfileState = {
  name: string;
  email: string;
  phone: string;
  image: string;
  specialization: string;
  consultationFee: string;
  roomNumber: string;
  gender: string;
  bloodGroup: string;
  age: string;
  address: string;
  emergencyContact: string;
};

export function SettingsForm({ user, preferences }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState(preferences);
  const [profile, setProfile] = useState(() => toProfileState(user));
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfile(toProfileState(user));
  }, [user]);

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  const roleLabel = useMemo(() => {
    if (user.role === "DOCTOR" || user.doctorProfile) return "Doctor";
    if (user.role === "PATIENT" || user.patientProfile) return "Patient";
    if (user.role === "RECEPTION" || user.receptionProfile) return "Receptionist";
    return user.role || "User";
  }, [user]);

  const handlePreferenceToggle = async (key: "emailAlerts" | "queueUpdates") => {
    const previous = prefs;
    const nextValue = !prefs[key];
    setPrefs({ ...prefs, [key]: nextValue });

    const res = await updatePreferences({ [key]: nextValue });
    if (!res.success) {
      toast.error(res.error);
      setPrefs(previous);
    } else {
      setPrefs(res.preferences || { ...prefs, [key]: nextValue });
      toast.success("Preference updated");
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setProfile((current) => ({ ...current, image }));
  };

  const onProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    const res = await updateProfile({
      name: profile.name,
      image: profile.image || undefined,
      phone: profile.phone || null,
      specialization: profile.specialization || null,
      consultationFee: profile.consultationFee ? Number(profile.consultationFee) : null,
      roomNumber: profile.roomNumber || null,
      gender: profile.gender ? profile.gender as any : null,
      bloodGroup: profile.bloodGroup ? profile.bloodGroup as any : null,
      age: profile.age ? Number(profile.age) : null,
      address: profile.address || null,
      emergencyContact: profile.emergencyContact || null,
    });

    setLoading(false);
    if (res.success) {
      if (res.user) setProfile(toProfileState(res.user as SettingsUser));
      toast.success("Profile updated");
    } else {
      toast.error(res.error);
    }
  };

  const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordLoading) return;

    const validation = validatePassword(passwords);
    if (validation) {
      toast.error(validation);
      return;
    }

    setPasswordLoading(true);
    const res = await updatePassword(passwords);
    setPasswordLoading(false);

    if (res.success) {
      toast.success("Password updated. Use the new password the next time you sign in.");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordModal(false);
    } else {
      toast.error(res.error);
    }
  };

  const role = user.doctorProfile ? "Doctor" : user.patientProfile ? "Patient" : "Receptionist";

  return (
    <div className="grid gap-8">
      <GlassCard className="overflow-hidden border-border/40">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-b border-border/20" />
        <form onSubmit={onProfileSubmit} className="p-8 -mt-12 space-y-8">
          <div className="flex flex-col sm:flex-row items-end gap-6">
            <div className="relative group">
              <label className="cursor-pointer">
                <input type="file" name="avatar" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div className="h-32 w-32 rounded-[2rem] bg-secondary flex items-center justify-center text-4xl font-bold overflow-hidden border-4 border-background shadow-2xl group-hover:border-primary/40 transition-all duration-500 group-hover:scale-105">
                  {profile.image ? <Image src={profile.image} alt="Avatar" width={128} height={128} unoptimized className="h-full w-full object-cover" /> : profile.name?.[0]}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 grid place-items-center rounded-[2rem] text-white">
                  <Camera className="h-8 w-8" />
                  <span className="text-[10px] font-bold uppercase mt-1">Change</span>
                </div>
              </label>
            </div>
            <div className="flex-1 pb-2">
              <div className="text-2xl font-black tracking-tight">{profile.name}</div>
              <div className="text-sm text-muted-foreground font-medium">{profile.email}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                  {roleLabel} Profile
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Full Name">
              <Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="h-12 rounded-xl bg-background/50 border-border/40" required />
            </Field>
            <Field label="Email Address">
              <Input value={profile.email} className="h-12 rounded-xl bg-secondary/30 border-border/20 opacity-60 cursor-not-allowed" disabled />
            </Field>
            <Field label="Phone / Contact">
              <Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="h-12 rounded-xl bg-background/50 border-border/40" placeholder="+880..." />
            </Field>

            {(user.role === "DOCTOR" || user.doctorProfile) && (
              <>
                <Field label="Specialization">
                  <Input value={profile.specialization} onChange={(event) => setProfile({ ...profile, specialization: event.target.value })} className="h-12 rounded-xl bg-background/50 border-border/40" required />
                </Field>
                <Field label="Consultation Fee (BDT)">
                  <Input value={profile.consultationFee} onChange={(event) => setProfile({ ...profile, consultationFee: event.target.value })} type="number" min="0" className="h-12 rounded-xl bg-background/50 border-border/40" required />
                </Field>
                <Field label="Room Number">
                  <Input value={profile.roomNumber} onChange={(event) => setProfile({ ...profile, roomNumber: event.target.value })} className="h-12 rounded-xl bg-background/50 border-border/40" placeholder="Optional global room" />
                </Field>
              </>
            )}

            {(user.role === "PATIENT" || user.patientProfile) && (
              <>
                <Field label="Gender">
                  <select value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })} className="h-12 rounded-xl bg-background/50 border border-border/40 px-3 text-sm">
                    <option value="">Select gender</option>
                    {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select value={profile.bloodGroup} onChange={(event) => setProfile({ ...profile, bloodGroup: event.target.value })} className="h-12 rounded-xl bg-background/50 border border-border/40 px-3 text-sm">
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((bloodGroup) => <option key={bloodGroup} value={bloodGroup}>{bloodGroup}</option>)}
                  </select>
                </Field>
                <Field label="Age">
                  <Input value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} type="number" min="0" max="130" className="h-12 rounded-xl bg-background/50 border-border/40" />
                </Field>
                <Field label="Emergency Contact">
                  <Input value={profile.emergencyContact} onChange={(event) => setProfile({ ...profile, emergencyContact: event.target.value })} className="h-12 rounded-xl bg-background/50 border-border/40" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} className="h-12 rounded-xl bg-background/50 border-border/40" />
                  </Field>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button disabled={loading} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground shadow-glow font-bold transition-all active:scale-95">
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Check className="h-5 w-5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="grid sm:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass rounded-xl">
              <div>
                <div className="text-sm font-semibold">Two-Factor Auth</div>
                <div className="text-[10px] text-muted-foreground">Extra layer of security</div>
              </div>
              <button className="h-6 w-11 rounded-full bg-sidebar-accent relative opacity-50 cursor-not-allowed" type="button">
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-muted-foreground" />
              </button>
            </div>

            <Dialog open={passwordModal} onOpenChange={setPasswordModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start glass text-xs h-10">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-border/60">
                <DialogHeader>
                  <DialogTitle>Update Password</DialogTitle>
                  <DialogDescription>
                    Use at least 8 characters with uppercase, lowercase, and a number.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onPasswordSubmit} className="space-y-4">
                  <Field label="Current Password">
                    <Input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" autoComplete="current-password" />
                  </Field>
                  <Field label="New Password">
                    <Input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" autoComplete="new-password" />
                  </Field>
                  <Field label="Confirm New Password">
                    <Input type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" autoComplete="new-password" />
                  </Field>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setPasswordModal(false)} disabled={passwordLoading}>
                      Cancel
                    </Button>
                    <Button disabled={passwordLoading} className="bg-primary text-primary-foreground shadow-glow">
                      {passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Password
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </h3>
          <div className="space-y-4">
            <PreferenceToggle label="Email Alerts" description="Receive appointment summaries" checked={prefs.emailAlerts} onClick={() => handlePreferenceToggle("emailAlerts")} />
            <PreferenceToggle label="Queue Updates" description="Live movement notifications" checked={prefs.queueUpdates} onClick={() => handlePreferenceToggle("queueUpdates")} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{label}</Label>
      {children}
    </div>
  );
}

function PreferenceToggle({ label, description, checked, onClick }: { label: string; description: string; checked: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium">{label}</span>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "h-5 w-10 rounded-full transition-colors relative",
          checked ? "bg-primary" : "bg-sidebar-accent"
        )}
      >
        <div className={cn(
          "absolute top-1 h-3 w-3 rounded-full bg-white transition-all",
          checked ? "right-1" : "left-1"
        )} />
      </button>
    </div>
  );
}

function toProfileState(user: SettingsUser): ProfileState {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    image: user.image || "",
    specialization: user.doctorProfile?.specialization || "",
    consultationFee: user.doctorProfile?.consultationFee != null ? String(user.doctorProfile.consultationFee) : "",
    roomNumber: user.doctorProfile?.roomNumber || "",
    gender: user.patientProfile?.gender || "",
    bloodGroup: user.patientProfile?.bloodGroup || "",
    age: user.patientProfile?.age != null ? String(user.patientProfile.age) : "",
    address: user.patientProfile?.address || "",
    emergencyContact: user.patientProfile?.emergencyContact || "",
  };
}

function validatePassword(values: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  if (!values.currentPassword) return "Current password is required.";
  if (values.newPassword.length < 8) return "New password must be at least 8 characters.";
  if (!/[a-z]/.test(values.newPassword) || !/[A-Z]/.test(values.newPassword) || !/[0-9]/.test(values.newPassword)) {
    return "New password must include uppercase, lowercase, and a number.";
  }
  if (values.currentPassword === values.newPassword) return "New password must be different from the current password.";
  if (values.newPassword !== values.confirmPassword) return "New password and confirmation do not match.";
  return "";
}
