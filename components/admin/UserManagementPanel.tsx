"use client"

import { useMemo, useState } from "react";
import { Building2, Loader2, Search, ShieldCheck, Stethoscope, UserCog, Users2 } from "lucide-react";
import { toast } from "sonner";
import { createDepartment, createHospital, updateManagedUser } from "@/app/actions/admin-users";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "PATIENT" | "DOCTOR" | "RECEPTION" | "ADMIN" | "SUPER_ADMIN";

type HospitalOption = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
};

type DepartmentOption = {
  id: string;
  name: string;
  hospitalId?: string | null;
  hospital?: HospitalOption | null;
};

type ManagedUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  doctorProfile?: {
    id: string;
    specialization: string | null;
    consultationFee: number | null;
    roomNumber: string | null;
    departmentIds: string[];
    departments?: DepartmentOption[];
  } | null;
  receptionProfile?: {
    hospitalId: string | null;
    hospital?: HospitalOption | null;
  } | null;
  patientProfile?: {
    age: number | null;
    gender: string | null;
    bloodGroup: string | null;
  } | null;
};

interface UserManagementPanelProps {
  initialUsers: ManagedUser[];
  hospitals: HospitalOption[];
  departments: DepartmentOption[];
}

const ROLE_OPTIONS: Array<Role | "ALL"> = ["ALL", "PATIENT", "DOCTOR", "RECEPTION", "ADMIN", "SUPER_ADMIN"];

export function UserManagementPanel({ initialUsers, hospitals, departments }: UserManagementPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [hospitalOptions, setHospitalOptions] = useState(hospitals);
  const [departmentOptions, setDepartmentOptions] = useState(departments);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creatingHospital, setCreatingHospital] = useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({ name: "", address: "", phone: "" });
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    hospitalId: hospitals[0]?.id || "",
    description: "",
  });

  const departmentGroups = useMemo(() => {
    const groups = new Map<string, { hospital: HospitalOption | null; departments: DepartmentOption[] }>();
    for (const department of departmentOptions) {
      const key = department.hospital?.id || "unassigned";
      if (!groups.has(key)) {
        groups.set(key, { hospital: department.hospital ?? null, departments: [] });
      }
      groups.get(key)!.departments.push(department);
    }
    return Array.from(groups.values());
  }, [departmentOptions]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const haystack = `${user.name || ""} ${user.email || ""} ${user.phone || ""}`.toLowerCase();
      return matchesRole && (!normalized || haystack.includes(normalized));
    });
  }, [query, roleFilter, users]);

  const patchUser = (userId: string, patch: Partial<ManagedUser>) => {
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, ...patch } : user));
  };

  const patchDoctor = (userId: string, patch: Partial<NonNullable<ManagedUser["doctorProfile"]>>) => {
    setUsers((current) => current.map((user) => {
      if (user.id !== userId) return user;
      const doctorProfile = user.doctorProfile ?? {
        id: "",
        specialization: "",
        consultationFee: null,
        roomNumber: "",
        departmentIds: [],
        departments: [],
      };
      return { ...user, doctorProfile: { ...doctorProfile, ...patch } };
    }));
  };

  const patchReception = (userId: string, patch: Partial<NonNullable<ManagedUser["receptionProfile"]>>) => {
    setUsers((current) => current.map((user) => {
      if (user.id !== userId) return user;
      const receptionProfile = user.receptionProfile ?? { hospitalId: null, hospital: null };
      return { ...user, receptionProfile: { ...receptionProfile, ...patch } };
    }));
  };

  const toggleDepartment = (user: ManagedUser, departmentId: string) => {
    const current = new Set(user.doctorProfile?.departmentIds ?? []);
    if (current.has(departmentId)) {
      current.delete(departmentId);
    } else {
      current.add(departmentId);
    }
    patchDoctor(user.id, { departmentIds: Array.from(current) });
  };

  const toggleHospital = (user: ManagedUser, hospitalId: string) => {
    const hospitalDepartmentIds = departmentOptions
      .filter((department) => (department.hospital?.id || department.hospitalId) === hospitalId)
      .map((department) => department.id);

    if (hospitalDepartmentIds.length === 0) {
      toast.error("Add at least one department under this hospital before assigning it to a doctor.");
      return;
    }

    const current = new Set(user.doctorProfile?.departmentIds ?? []);
    const hasAny = hospitalDepartmentIds.some((departmentId) => current.has(departmentId));

    for (const departmentId of hospitalDepartmentIds) {
      if (hasAny) {
        current.delete(departmentId);
      } else {
        current.add(departmentId);
      }
    }

    patchDoctor(user.id, { departmentIds: Array.from(current) });
  };

  const handleCreateHospital = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingHospital) return;
    setCreatingHospital(true);

    const result = await createHospital({
      name: hospitalForm.name,
      address: hospitalForm.address,
      phone: hospitalForm.phone || null,
    });

    setCreatingHospital(false);

    if (!result.success || !result.hospital) {
      toast.error(result.error || "Failed to create hospital");
      return;
    }

    setHospitalOptions((current) => [...current, result.hospital].sort((a, b) => a.name.localeCompare(b.name)));
    setDepartmentForm((current) => ({ ...current, hospitalId: current.hospitalId || result.hospital.id }));
    setHospitalForm({ name: "", address: "", phone: "" });
    toast.success("Hospital added");
  };

  const handleCreateDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingDepartment) return;
    setCreatingDepartment(true);

    const result = await createDepartment({
      name: departmentForm.name,
      hospitalId: departmentForm.hospitalId,
      description: departmentForm.description || null,
    });

    setCreatingDepartment(false);

    if (!result.success || !result.department) {
      toast.error(result.error || "Failed to create department");
      return;
    }

    setDepartmentOptions((current) => [...current, result.department].sort((a, b) => a.name.localeCompare(b.name)));
    setDepartmentForm((current) => ({ ...current, name: "", description: "" }));
    toast.success("Department added");
  };

  const saveUser = async (user: ManagedUser) => {
    if (savingId) return;
    setSavingId(user.id);

    const result = await updateManagedUser({
      userId: user.id,
      name: user.name || "",
      phone: user.phone || null,
      isActive: user.isActive,
      specialization: user.doctorProfile?.specialization || null,
      consultationFee: user.doctorProfile?.consultationFee ?? null,
      roomNumber: user.doctorProfile?.roomNumber || null,
      departmentIds: user.doctorProfile?.departmentIds ?? [],
      hospitalId: user.receptionProfile?.hospitalId || null,
    });

    setSavingId(null);

    if (!result.success || !result.user) {
      toast.error(result.error || "Failed to update user");
      return;
    }

    setUsers((current) => current.map((item) => item.id === user.id ? result.user as ManagedUser : item));
    toast.success("User updated");
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or phone"
              className="h-11 rounded-xl bg-background/50 border-border/40 pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | "ALL")}
            className="h-11 rounded-xl border border-border/40 bg-background/50 px-3 text-sm"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role === "ALL" ? "All roles" : roleLabel(role)}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Hospital & Department Setup</h2>
          <p className="text-sm text-muted-foreground">
            Doctors can create schedules only after they are assigned to a department linked to a hospital.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={handleCreateHospital} className="rounded-2xl border border-border/40 bg-background/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Add Hospital
            </div>
            <Field label="Hospital Name">
              <Input
                value={hospitalForm.name}
                onChange={(event) => setHospitalForm({ ...hospitalForm, name: event.target.value })}
                className="h-11 rounded-xl bg-background/50 border-border/40"
                placeholder="Hospital name"
                required
              />
            </Field>
            <Field label="Address">
              <Input
                value={hospitalForm.address}
                onChange={(event) => setHospitalForm({ ...hospitalForm, address: event.target.value })}
                className="h-11 rounded-xl bg-background/50 border-border/40"
                placeholder="Hospital address"
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                value={hospitalForm.phone}
                onChange={(event) => setHospitalForm({ ...hospitalForm, phone: event.target.value })}
                className="h-11 rounded-xl bg-background/50 border-border/40"
                placeholder="Optional"
              />
            </Field>
            <Button type="submit" disabled={creatingHospital} className="w-full bg-primary text-primary-foreground shadow-glow">
              {creatingHospital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Hospital
            </Button>
          </form>

          <form onSubmit={handleCreateDepartment} className="rounded-2xl border border-border/40 bg-background/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users2 className="h-4 w-4 text-primary" />
              Add Department
            </div>
            <Field label="Hospital">
              <select
                value={departmentForm.hospitalId}
                onChange={(event) => setDepartmentForm({ ...departmentForm, hospitalId: event.target.value })}
                className="h-11 w-full rounded-xl border border-border/40 bg-background/50 px-3 text-sm"
                required
              >
                {hospitalOptions.length === 0 ? (
                  <option value="">Add a hospital first</option>
                ) : (
                  hospitalOptions.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                  ))
                )}
              </select>
            </Field>
            <Field label="Department Name">
              <Input
                value={departmentForm.name}
                onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
                className="h-11 rounded-xl bg-background/50 border-border/40"
                placeholder="Example: General Medicine"
                required
              />
            </Field>
            <Field label="Description">
              <Input
                value={departmentForm.description}
                onChange={(event) => setDepartmentForm({ ...departmentForm, description: event.target.value })}
                className="h-11 rounded-xl bg-background/50 border-border/40"
                placeholder="Optional"
              />
            </Field>
            <Button type="submit" disabled={creatingDepartment || hospitalOptions.length === 0} className="w-full bg-primary text-primary-foreground shadow-glow">
              {creatingDepartment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Department
            </Button>
          </form>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <GlassCard key={user.id} className="p-5">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{user.name || "Unnamed user"}</h3>
                      <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-wider", roleClass(user.role))}>
                        {roleLabel(user.role)}
                      </Badge>
                      <Badge variant={user.isActive ? "default" : "outline"} className="text-[10px]">
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email || "No email"}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => saveUser(user)}
                    disabled={savingId !== null}
                    className="bg-primary text-primary-foreground shadow-glow"
                  >
                    {savingId === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save User
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Name">
                    <Input value={user.name || ""} onChange={(event) => patchUser(user.id, { name: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" />
                  </Field>
                  <Field label="Phone">
                    <Input value={user.phone || ""} onChange={(event) => patchUser(user.id, { phone: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" placeholder="+880..." />
                  </Field>
                  <Field label="Status">
                    <label className="flex h-11 items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={user.isActive}
                        onChange={(event) => patchUser(user.id, { isActive: event.target.checked })}
                      />
                      Account active
                    </label>
                  </Field>
                </div>

                {user.role === "DOCTOR" && (
                  <div className="rounded-2xl border border-border/40 bg-background/30 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Doctor hospital and department assignment
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Specialization">
                        <Input value={user.doctorProfile?.specialization || ""} onChange={(event) => patchDoctor(user.id, { specialization: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" />
                      </Field>
                      <Field label="Consultation Fee">
                        <Input
                          type="number"
                          min="0"
                          value={user.doctorProfile?.consultationFee ?? ""}
                          onChange={(event) => patchDoctor(user.id, { consultationFee: event.target.value === "" ? null : Number(event.target.value) })}
                          className="h-11 rounded-xl bg-background/50 border-border/40"
                        />
                      </Field>
                      <Field label="Room Number">
                        <Input value={user.doctorProfile?.roomNumber || ""} onChange={(event) => patchDoctor(user.id, { roomNumber: event.target.value })} className="h-11 rounded-xl bg-background/50 border-border/40" />
                      </Field>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Hospitals</div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {hospitalOptions.map((hospital) => {
                            const hospitalDepartmentIds = departmentOptions
                              .filter((department) => (department.hospital?.id || department.hospitalId) === hospital.id)
                              .map((department) => department.id);
                            const selectedCount = hospitalDepartmentIds.filter((departmentId) => (user.doctorProfile?.departmentIds ?? []).includes(departmentId)).length;
                            const disabled = hospitalDepartmentIds.length === 0;

                            return (
                              <label
                                key={hospital.id}
                                className={cn(
                                  "flex items-start gap-2 rounded-lg border border-border/30 bg-background/40 px-3 py-2 text-sm",
                                  disabled && "opacity-60"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCount > 0}
                                  disabled={disabled}
                                  onChange={() => toggleHospital(user, hospital.id)}
                                  className="mt-1"
                                />
                                <span>
                                  <span className="block font-medium">{hospital.name}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {disabled ? "Add a department first" : `${selectedCount}/${hospitalDepartmentIds.length} departments assigned`}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Selecting a hospital assigns its departments, which makes the hospital available on the doctor's Schedule page.
                        </p>
                      </div>

                      {departmentGroups.length > 0 ? departmentGroups.map((group) => (
                        <div key={group.hospital?.id || "unassigned"} className="rounded-xl border border-border/30 bg-secondary/20 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {group.hospital?.name || "Departments without hospital"}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {group.departments.map((department) => (
                              <label key={department.id} className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/40 px-3 py-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={(user.doctorProfile?.departmentIds ?? []).includes(department.id)}
                                  onChange={() => toggleDepartment(user, department.id)}
                                />
                                {department.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed border-border/40 bg-background/30 p-4 text-sm text-muted-foreground">
                          No departments are available yet. Add a department above, then assign it to the doctor.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {user.role === "RECEPTION" && (
                  <div className="rounded-2xl border border-border/40 bg-background/30 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                      <Users2 className="h-4 w-4 text-primary" />
                      Receptionist hospital assignment
                    </div>
                    <Field label="Assigned Hospital">
                      <select
                        value={user.receptionProfile?.hospitalId || ""}
                        onChange={(event) => patchReception(user.id, { hospitalId: event.target.value || null })}
                        className="h-11 w-full rounded-xl border border-border/40 bg-background/50 px-3 text-sm"
                      >
                        <option value="">No hospital assigned</option>
                        {hospitalOptions.map((hospital) => (
                          <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                  <div className="rounded-2xl border border-border/40 bg-background/30 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Admin account
                    </div>
                    <p className="mt-1">
                      Admin profile editing is limited to basic account fields here. Password changes remain in Admin Settings.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-10 text-center text-muted-foreground">
            <UserCog className="mx-auto mb-3 h-8 w-8" />
            No users found.
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function roleLabel(role: Role | "ALL") {
  if (role === "RECEPTION") return "Receptionist";
  if (role === "SUPER_ADMIN") return "Super Admin";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function roleClass(role: Role) {
  if (role === "DOCTOR") return "border-sky-400/30 text-sky-300 bg-sky-400/10";
  if (role === "RECEPTION") return "border-orange-400/30 text-orange-300 bg-orange-400/10";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "border-violet-400/30 text-violet-300 bg-violet-400/10";
  return "border-primary/30 text-primary bg-primary/10";
}
