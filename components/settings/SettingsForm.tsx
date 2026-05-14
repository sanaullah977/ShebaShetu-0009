"use client"

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Shield, Bell, Loader2, Camera, Check } from "lucide-react";
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

interface SettingsFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    doctorProfile?: {
      specialization: string;
      consultationFee: number | null;
      roomNumber: string | null;
    } | null;
    patientProfile?: {
      age: number | null;
      gender: string | null;
      bloodGroup: string | null;
      address: string | null;
      emergencyContact: string | null;
    } | null;
  };
  preferences: {
    emailAlerts: boolean;
    queueUpdates: boolean;
  };
}

export function SettingsForm({ user, preferences }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState(preferences);
  const [passwordModal, setPasswordModal] = useState(false);

  const handlePreferenceToggle = async (key: "emailAlerts" | "queueUpdates") => {
    const nextValue = !prefs[key];
    setPrefs({ ...prefs, [key]: nextValue });
    
    const res = await updatePreferences({ [key]: nextValue });
    if (!res.success) {
      toast.error(res.error);
      setPrefs({ ...prefs, [key]: !nextValue }); // Rollback
    } else {
      toast.success("Preference updated");
    }
  };

  const onProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const file = (e.currentTarget.elements.namedItem("avatar") as HTMLInputElement).files?.[0];
    let image = user.image;

    if (file) {
      image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const res = await updateProfile({
      name: formData.get("name") as string,
      image: image,
      specialization: formData.get("specialization") as string,
      consultationFee: formData.get("consultationFee") ? Number(formData.get("consultationFee")) : undefined,
      roomNumber: formData.get("roomNumber") as string,
      age: formData.get("age") ? Number(formData.get("age")) : undefined,
      gender: formData.get("gender") as string,
      bloodGroup: formData.get("bloodGroup") as string,
      address: formData.get("address") as string,
      emergencyContact: formData.get("emergencyContact") as string,
    });
    setLoading(false);
    if (res.success) toast.success("Profile updated");
    else toast.error(res.error);
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
                <input type="file" name="avatar" accept="image/*" className="hidden" />
                <div className="h-32 w-32 rounded-[2rem] bg-secondary flex items-center justify-center text-4xl font-bold overflow-hidden border-4 border-background shadow-2xl group-hover:border-primary/40 transition-all duration-500 group-hover:scale-105">
                  {user.image ? <img src={user.image} alt="Avatar" className="h-full w-full object-cover" /> : user.name?.[0]}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 grid place-items-center rounded-[2rem] text-white">
                  <Camera className="h-8 w-8" />
                  <span className="text-[10px] font-bold uppercase mt-1">Change</span>
                </div>
              </label>
            </div>
            <div className="flex-1 pb-2">
              <div className="text-2xl font-black tracking-tight">{user.name}</div>
              <div className="text-sm text-muted-foreground font-medium">{user.email}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={cn(
                  "border-primary/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                  role === "Doctor" ? "bg-primary/10 text-primary" :
                  role === "Patient" ? "bg-emerald-500/10 text-emerald-600" :
                  "bg-blue-500/10 text-blue-600"
                )}>
                  {role} Profile
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</Label>
                <Input name="name" className="h-12 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20 focus:border-primary/40 transition-all" defaultValue={user.name} required />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</Label>
                <Input className="h-12 rounded-xl bg-secondary/30 border-border/20 opacity-60 cursor-not-allowed" defaultValue={user.email} disabled />
             </div>

             {user.doctorProfile && (
               <>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Specialization</Label>
                    <Input name="specialization" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.doctorProfile.specialization} required />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Consultation Fee (৳)</Label>
                    <Input name="consultationFee" type="number" min="0" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.doctorProfile.consultationFee || 0} required />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Room Number</Label>
                    <Input name="roomNumber" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.doctorProfile.roomNumber || ""} />
                 </div>
               </>
             )}

             {user.patientProfile && (
               <>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Age</Label>
                    <Input name="age" type="number" min="0" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.patientProfile.age || ""} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Gender</Label>
                    <Input name="gender" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.patientProfile.gender || ""} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Blood Group</Label>
                    <Input name="bloodGroup" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.patientProfile.bloodGroup || ""} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Emergency Contact</Label>
                    <Input name="emergencyContact" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.patientProfile.emergencyContact || ""} />
                 </div>
                 <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Address</Label>
                    <Input name="address" className="h-12 rounded-xl bg-background/50 border-border/40" defaultValue={user.patientProfile.address || ""} />
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
              <button className="h-6 w-11 rounded-full bg-sidebar-accent relative opacity-50 cursor-not-allowed">
                 <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-muted-foreground" />
              </button>
            </div>

            <Dialog open={passwordModal} onOpenChange={setPasswordModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start glass text-xs h-10">Update Password</Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-border/60">
                <DialogHeader>
                  <DialogTitle>Update Password</DialogTitle>
                  <DialogDescription>
                    For your security, please contact your hospital administrator to reset your password, or use the "Forgot Password" flow on the login page.
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setPasswordModal(false)} className="bg-primary text-primary-foreground shadow-glow">
                    Got it
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </GlassCard>
        
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Email Alerts</span>
                  <p className="text-[10px] text-muted-foreground">Receive appointment summaries</p>
                </div>
                <button 
                  onClick={() => handlePreferenceToggle("emailAlerts")}
                  className={cn(
                    "h-5 w-10 rounded-full transition-colors relative",
                    prefs.emailAlerts ? "bg-primary" : "bg-sidebar-accent"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 h-3 w-3 rounded-full bg-white transition-all",
                    prefs.emailAlerts ? "right-1" : "left-1"
                  )} />
                </button>
             </div>
             <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Queue Updates</span>
                  <p className="text-[10px] text-muted-foreground">Live movement notifications</p>
                </div>
                <button 
                  onClick={() => handlePreferenceToggle("queueUpdates")}
                  className={cn(
                    "h-5 w-10 rounded-full transition-colors relative",
                    prefs.queueUpdates ? "bg-primary" : "bg-sidebar-accent"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 h-3 w-3 rounded-full bg-white transition-all",
                    prefs.queueUpdates ? "right-1" : "left-1"
                  )} />
                </button>
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
