import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Save, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import { EmptyState, Money, PageHeader, Panel, StatusBadge } from "@/components/fin/primitives";
import { PageLoadingSkeleton } from "@/components/fin/loading-skeleton";
import { useClasses } from "@/hooks/use-classes";
import { naira } from "@/lib/school-data";
import {
  useAssignTeacher,
  useClassFeeAssignments,
  useClassTeachers,
  useCreateTeacher,
  useDeleteFeeTemplate,
  useDeleteTeacher,
  useFeeTemplates,
  useRemoveTeacherFromClass,
  useSchoolSettings,
  useStaffAccounts,
  useTeachers,
  useUpdateSchoolSettings,
  useUpdateTeacher,
  useUpsertClassFeeAssignment,
  useUpsertFeeTemplate,
} from "@/hooks/use-settings";
import { SECTIONS, type ClassFeeAssignment } from "@/lib/settings-data";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — DaskaSchool" }] }),
  component: SettingsPage,
});

const TABS = ["School", "Fee Templates", "Teachers", "Users"] as const;
type Tab = (typeof TABS)[number];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("School");
  const { data: schoolSettings, isLoading } = useSchoolSettings();

  if (isLoading)
    return (
      <AppShell>
        <PageLoadingSkeleton metricCards={0} showTable={false} />
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        subtitle="School profile, fee templates, teachers and staff accounts — Super Admin only."
      />
      <div className="mt-6 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "School" && schoolSettings && <SchoolTab initial={schoolSettings} />}
        {tab === "Fee Templates" && <FeeTemplatesTab />}
        {tab === "Teachers" && <TeachersTab />}
        {tab === "Users" && <UsersTab />}
      </div>
    </AppShell>
  );
}

// ── School Tab ─────────────────────────────────────────────────────
const schoolSchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  currentSession: z.string().min(1, "Required"),
  currentTerm: z.string().min(1, "Required"),
});
type SchoolForm = z.infer<typeof schoolSchema>;

function SchoolTab({ initial }: { initial: SchoolForm }) {
  const updateSchool = useUpdateSchoolSettings();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    defaultValues: initial,
  });
  const onSubmit = async (values: SchoolForm) => {
    try {
      await updateSchool.mutateAsync(values);
      toast.success("School settings saved.");
    } catch (err) {
      console.error("[settings/SchoolTab]", err);
      toast.error("Couldn't save. Please try again.");
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Panel title="School profile" bodyClassName="p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SField label="School name" error={errors.name?.message} {...register("name")} />
          </div>
          <SField label="Address" {...register("address")} />
          <SField label="Phone number" {...register("phone")} />
        </div>
      </Panel>
      <Panel title="Current academic period" bodyClassName="p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Academic session</span>
            <select
              {...register("currentSession")}
              className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
            >
              {["2024 / 2025", "2025 / 2026", "2026 / 2027", "2027 / 2028"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Current term</span>
            <select
              {...register("currentTerm")}
              className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
            >
              {["First Term", "Second Term", "Third Term"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          <Save className="size-4" /> {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ── Fee Templates Tab ──────────────────────────────────────────────
function FeeTemplatesTab() {
  const { data: templates, isLoading } = useFeeTemplates();
  const upsert = useUpsertFeeTemplate();
  const remove = useDeleteFeeTemplate();
  const [adding, setAdding] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newAllowInstallment, setNewAllowInstallment] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const bySection = SECTIONS.map((section) => ({
    section,
    items: (templates ?? []).filter((t) => t.section === section),
  }));

  const handleAdd = async (section: string) => {
    if (!newLabel.trim() || newAmount === "" || Number(newAmount) < 0) return;
    try {
      await upsert.mutateAsync({
        section,
        label: newLabel.trim(),
        amount: Number(newAmount),
        allowInstallment: newAllowInstallment,
      });
      toast.success(`Added "${newLabel}" to ${section}`);
      setNewLabel("");
      setNewAmount("");
      setNewAllowInstallment(false);
      setAdding(null);
    } catch {
      toast.error("Couldn't add item.");
    }
  };

  const handleSaveEdit = async (id: string, section: string, label: string) => {
    if (editAmount === "" || Number(editAmount) < 0) return;
    try {
      await upsert.mutateAsync({
        section,
        label,
        amount: Number(editAmount),
        allowInstallment: templates?.find((item) => item.id === id)?.allowInstallment ?? false,
        id,
      });
      toast.success("Amount updated.");
      setEditId(null);
    } catch {
      toast.error("Couldn't update amount.");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success(`"${label}" removed.`);
    } catch {
      toast.error("Couldn't remove item.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Fee templates set default item prices per section. They flow automatically to every class in
        that section when recording a payment. Override individual amounts per class using the
        "Class-specific overrides" panel below each template.
      </p>
      {bySection.map(({ section, items }) => (
        <Panel
          key={section}
          title={`${section} section`}
          description={`${items.length} item${items.length !== 1 ? "s" : ""} — applies to all ${section} classes`}
          action={
            <button
              onClick={() => {
                setAdding(section);
                setNewLabel("");
                setNewAmount("");
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus className="size-3.5" /> Add item
            </button>
          }
          bodyClassName="p-0"
        >
          {items.length === 0 && adding !== section ? (
            <p className="px-6 py-5 text-sm text-muted-foreground">
              No items yet. Click "Add item" to set fees for this section.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center gap-4 px-6 py-4">
                    <button
                      onClick={() =>
                        setExpandedTemplate(expandedTemplate === item.id ? null : item.id)
                      }
                      className="flex items-center gap-2 text-sm font-semibold hover:text-primary"
                    >
                      <span
                        className={`inline-block transition-transform ${expandedTemplate === item.id ? "rotate-90" : ""}`}
                      >
                        ▸
                      </span>
                      {item.label}
                    </button>
                    <div className="flex-1" />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={item.allowInstallment}
                        onChange={(event) =>
                          upsert.mutate(
                            {
                              section: item.section,
                              label: item.label,
                              amount: item.amount,
                              allowInstallment: event.target.checked,
                              id: item.id,
                            },
                            {
                              onSuccess: () => toast.success("Installment setting updated."),
                              onError: () => toast.error("Couldn't update installment setting."),
                            },
                          )
                        }
                        className="size-4 accent-[color:var(--primary)]"
                      />
                      Allow installment
                    </label>
                    {editId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="num h-9 w-32 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id, item.section, item.label)}
                          className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditId(null)} className="text-muted-foreground">
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Money value={item.amount} className="text-sm font-semibold" />
                        <button
                          onClick={() => {
                            setEditId(item.id);
                            setEditAmount(String(item.amount));
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.label)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* ── Class-specific overrides ───────────────── */}
                  {expandedTemplate === item.id && (
                    <ClassOverridesPanel
                      templateId={item.id}
                      section={section}
                      sectionAmount={item.amount}
                    />
                  )}
                </div>
              ))}
              {adding === section && (
                <div className="flex items-center gap-3 px-6 py-4">
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Item label e.g. Uniform"
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Amount (₦)"
                    className="num h-10 w-32 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={newAllowInstallment}
                      onChange={(event) => setNewAllowInstallment(event.target.checked)}
                      className="size-4 accent-[color:var(--primary)]"
                    />
                    Allow installment
                  </label>
                  <button
                    onClick={() => handleAdd(section)}
                    className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    Add
                  </button>
                  <button onClick={() => setAdding(null)} className="text-muted-foreground">
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/**
 * Inline sub-panel that shows class-specific overrides for one fee template.
 * Rendered inside the expanded row of the FeeTemplatesTab.
 */
function ClassOverridesPanel({
  templateId,
  section,
  sectionAmount,
}: {
  templateId: string;
  section: string;
  sectionAmount: number;
}) {
  const { data: classes } = useClasses(false);
  const { data: assignments, isLoading } = useClassFeeAssignments(templateId);
  const upsertAssignment = useUpsertClassFeeAssignment();
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [overrideAmount, setOverrideAmount] = useState<number | "">("");

  const sectionClasses = (classes ?? []).filter((c) => c.section === section);

  if (isLoading) {
    return (
      <div className="bg-muted/40 px-10 py-4 text-sm text-muted-foreground">
        Loading class overrides…
      </div>
    );
  }

  const assignmentByClass = new Map((assignments ?? []).map((a) => [a.classId, a]));

  const handleToggleActive = async (
    classId: string,
    currentAssignment: ClassFeeAssignment | undefined,
    newActive: boolean,
  ) => {
    await upsertAssignment.mutateAsync({
      classId,
      templateId,
      amountOverride: currentAssignment?.amountOverride ?? null,
      isActive: newActive,
    });
    toast.success(newActive ? "Fee activated for this class." : "Fee deactivated for this class.");
  };

  const handleSaveOverride = async (classId: string) => {
    const existing = assignmentByClass.get(classId);
    await upsertAssignment.mutateAsync({
      classId,
      templateId,
      amountOverride: overrideAmount === "" ? null : Number(overrideAmount),
      isActive: existing?.isActive ?? true,
    });
    toast.success(
      overrideAmount === "" ? "Override removed — using section amount." : "Override amount saved.",
    );
    setEditingClassId(null);
    setOverrideAmount("");
  };

  return (
    <div className="border-t border-border bg-muted/30 px-6 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Class-specific overrides
      </p>
      {sectionClasses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No classes in this section.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["Class", "Uses section amount?", "Override amount", "Active"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sectionClasses.map((cls) => {
                const assignment = assignmentByClass.get(cls.id);
                const hasOverride = assignment?.amountOverride != null;
                const isActive = assignment ? assignment.isActive : true;
                const isEditing = editingClassId === cls.id;

                return (
                  <tr key={cls.id} className="hover:bg-muted/60">
                    <td className="px-3 py-2.5 font-semibold">{cls.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {hasOverride ? "No" : "Yes"}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={overrideAmount}
                            onChange={(e) =>
                              setOverrideAmount(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            placeholder={`Section: ${sectionAmount}`}
                            className="num h-8 w-28 rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => handleSaveOverride(cls.id)}
                            className="h-8 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingClassId(null);
                              setOverrideAmount("");
                            }}
                            className="text-muted-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {hasOverride ? (
                            <>
                              <Money
                                value={assignment!.amountOverride!}
                                className="font-semibold"
                              />
                              <button
                                onClick={() => {
                                  setEditingClassId(cls.id);
                                  setOverrideAmount(assignment!.amountOverride!);
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="size-3" />
                              </button>
                              <button
                                onClick={() => handleSaveOverride(cls.id)}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">—</span>
                              <button
                                onClick={() => {
                                  setEditingClassId(cls.id);
                                  setOverrideAmount("");
                                }}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Add override
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) =>
                          handleToggleActive(cls.id, assignment ?? undefined, e.target.checked)
                        }
                        className="size-4 accent-[color:var(--primary)]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Teachers Tab ───────────────────────────────────────────────────
function TeachersTab() {
  const { data: teachers, isLoading: tLoading } = useTeachers();
  const { data: classes } = useClasses(false);
  const { data: assignments, isLoading: aLoading } = useClassTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const assignTeacher = useAssignTeacher();
  const removeAssignment = useRemoveTeacherFromClass();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSalary, setNewSalary] = useState<number | "">("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSalary, setEditSalary] = useState<number | "">("");
  const [showAssign, setShowAssign] = useState(false);
  const [aTeacherId, setATeacherId] = useState("");
  const [aClassId, setAClassId] = useState("");
  const [aSalary, setASalary] = useState<number | "">("");

  if (tLoading || aLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createTeacher.mutateAsync({
        fullName: newName.trim(),
        defaultSalary: Number(newSalary) || 0,
      });
      toast.success(`${newName} added.`);
      setNewName("");
      setNewSalary("");
      setShowAdd(false);
    } catch {
      toast.error("Couldn't add teacher.");
    }
  };
  const handleUpdate = async (id: string) => {
    try {
      await updateTeacher.mutateAsync({
        id,
        fullName: editName,
        defaultSalary: Number(editSalary) || 0,
      });
      toast.success("Teacher updated.");
      setEditId(null);
    } catch {
      toast.error("Couldn't update.");
    }
  };
  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success(`${name} removed.`);
    } catch {
      toast.error("Couldn't remove — they may still be assigned to a class.");
    }
  };
  const handleAssign = async () => {
    if (!aTeacherId || !aClassId) return;
    try {
      await assignTeacher.mutateAsync({
        classId: aClassId,
        teacherId: aTeacherId,
        salaryAllocation: Number(aSalary) || 0,
      });
      toast.success("Teacher assigned.");
      setATeacherId("");
      setAClassId("");
      setASalary("");
      setShowAssign(false);
    } catch {
      toast.error("Couldn't assign.");
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Teacher roster"
        description="Add all teachers here once. Then assign them to classes below."
        action={
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Plus className="size-3.5" /> Add teacher
          </button>
        }
        bodyClassName="p-0"
      >
        {showAdd && (
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name e.g. Mrs Precious Ode"
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <input
              type="number"
              value={newSalary}
              onChange={(e) => setNewSalary(Number(e.target.value))}
              placeholder="Default salary (₦)"
              className="num h-10 w-40 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={handleAdd}
              className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        )}
        {!teachers || teachers.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="size-5" />}
            title="No teachers yet"
            description="Add teachers above, then assign them to classes."
          />
        ) : (
          <div className="divide-y divide-border">
            {teachers.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-4">
                {editId === t.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none"
                    />
                    <input
                      type="number"
                      value={editSalary}
                      onChange={(e) => setEditSalary(Number(e.target.value))}
                      className="num h-9 w-36 rounded-md border border-input bg-background px-3 text-sm outline-none"
                    />
                    <button
                      onClick={() => handleUpdate(t.id)}
                      className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className="text-muted-foreground">
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-sm font-semibold">{t.fullName}</p>
                    <span className="text-xs text-muted-foreground">
                      {naira(t.defaultSalary)} default
                    </span>
                    <button
                      onClick={() => {
                        setEditId(t.id);
                        setEditName(t.fullName);
                        setEditSalary(t.defaultSalary);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.fullName)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Class assignments"
        description="Assign teachers to specific classes with their salary allocation."
        action={
          teachers && teachers.length > 0 ? (
            <button
              onClick={() => setShowAssign((s) => !s)}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus className="size-3.5" /> Assign teacher
            </button>
          ) : null
        }
        bodyClassName="p-0"
      >
        {showAssign && (
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
            <select
              value={aTeacherId}
              onChange={(e) => {
                setATeacherId(e.target.value);
                const t = teachers?.find((t) => t.id === e.target.value);
                if (t) setASalary(t.defaultSalary);
              }}
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Select teacher</option>
              {(teachers ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
            <select
              value={aClassId}
              onChange={(e) => setAClassId(e.target.value)}
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">Select class</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.section})
                </option>
              ))}
            </select>
            <input
              type="number"
              value={aSalary}
              onChange={(e) => setASalary(Number(e.target.value))}
              placeholder="Salary allocation (₦)"
              className="num h-10 w-40 rounded-md border border-input bg-background px-3 text-sm outline-none"
            />
            <button
              onClick={handleAssign}
              disabled={!aTeacherId || !aClassId}
              className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Assign
            </button>
            <button onClick={() => setShowAssign(false)} className="text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        )}
        {!assignments || assignments.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">
            No assignments yet. Add teachers then assign them to classes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Teacher", "Class", "Salary allocation", ""].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/60">
                    <td className="px-6 py-4 font-semibold">{a.teacherName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.className}</td>
                    <td className="px-6 py-4">
                      <Money value={a.salaryAllocation} className="font-semibold" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          await removeAssignment.mutateAsync(a.id);
                          toast.success("Assignment removed.");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────
function UsersTab() {
  const { data: accounts, isLoading } = useStaffAccounts();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <Panel
      title="Staff accounts"
      description="All accounts with access to this app. New accounts are created in the Supabase dashboard by the developer."
      bodyClassName="p-0"
    >
      {!accounts || accounts.length === 0 ? (
        <p className="px-6 py-5 text-sm text-muted-foreground">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Name", "Role", "Staff ID"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-muted/60">
                  <td className="px-6 py-4 font-semibold">{a.fullName ?? "—"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge tone={a.role === "super_admin" ? "success" : "primary"}>
                      {a.role === "super_admin" ? "Super Admin" : "Staff"}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{a.staffId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────
const SField = React.forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function SField({ label, error, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        ref={ref}
        {...props}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  );
});
