import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fin/app-shell";
import { PageHeader, Panel } from "@/components/fin/primitives";
import { naira } from "@/lib/school-data";
import { useAuth } from "@/hooks/use-auth";
import { useClassOptions, useCreateStudent } from "@/hooks/use-students";

export const Route = createFileRoute("/students/new")({
  head: () => ({
    meta: [
      { title: "Add student — Divine Sources Finance OS" },
      {
        name: "description",
        content: "Enrol a new student — bio data, guardian details, class and fees.",
      },
    ],
  }),
  component: AddStudent,
});

const schema = z.object({
  fullName: z.string().min(1, "Required"),
  classId: z.string().min(1, "Select a class"),
  gender: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

function AddStudent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: classOptions, isLoading: classesLoading } = useClassOptions();
  const createStudent = useCreateStudent();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { discount: 0 },
  });

  const selectedClassId = watch("classId");
  const selectedClass = classOptions?.find((c) => c.id === selectedClassId);
  const discount = watch("discount") || 0;
  const grossFee = selectedClass
    ? selectedClass.tuitionFee + selectedClass.booksFee + selectedClass.otherCharges
    : 0;
  const expected = grossFee - (isSuperAdmin ? discount : 0);

  const onSubmit = async (values: FormValues) => {
    try {
      const { id, admissionNo } = await createStudent.mutateAsync({
        fullName: values.fullName,
        classId: values.classId,
        guardianName: values.guardianName ?? "",
        guardianPhone: values.guardianPhone ?? "",
        gender: values.gender ?? "",
        dob: values.dob ?? "",
        address: values.address ?? "",
        discount: isSuperAdmin ? values.discount : 0,
      });
      toast.success("Student enrolled", {
        description: `Admission number ${admissionNo} was generated automatically.`,
      });
      navigate({ to: "/students/$studentId", params: { studentId: id } });
    } catch (err) {
      console.error("[routes/students.new/onSubmit]", err);
      toast.error("Couldn't add this student. Please try again.");
    }
  };

  return (
    <AppShell>
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <div className="mt-5">
        <PageHeader
          title="Add a new student"
          subtitle="Admission number is generated automatically once you submit."
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <Panel title="Student information" bodyClassName="p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Full name"
              error={errors.fullName?.message}
              {...register("fullName")}
              placeholder="Chiamaka Okonkwo"
            />
            <SelectField label="Gender" {...register("gender")} options={["", "Female", "Male"]} />
            <Field label="Date of birth" type="date" {...register("dob")} />
            <div className="sm:col-span-2">
              <Field label="Home address" {...register("address")} placeholder="Ketu, Lagos" />
            </div>
          </div>
        </Panel>

        <Panel title="Guardian details" bodyClassName="p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Guardian full name"
              {...register("guardianName")}
              placeholder="Mr. Emeka Okonkwo"
            />
            <Field
              label="Phone number"
              {...register("guardianPhone")}
              placeholder="+234 803 000 0000"
            />
          </div>
        </Panel>

        <Panel title="Class & fees" bodyClassName="p-8">
          {classesLoading ? (
            <p className="text-sm text-muted-foreground">Loading classes…</p>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-semibold">Class</span>
                <select
                  {...register("classId")}
                  className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">Select a class</option>
                  {classOptions?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.section})
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.classId.message}</p>
                )}
              </label>

              {isSuperAdmin && (
                <div className="mt-6">
                  <Field
                    label="Discount amount (₦)"
                    type="number"
                    step="any"
                    {...register("discount")}
                  />
                </div>
              )}

              {selectedClass && (
                <div className="mt-6 rounded-md bg-muted p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Expected revenue from this student
                  </p>
                  <p className="num mt-2 text-2xl font-bold">{naira(expected)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tuition {naira(selectedClass.tuitionFee)} + Books{" "}
                    {naira(selectedClass.booksFee)} + Other {naira(selectedClass.otherCharges)}
                    {isSuperAdmin && discount > 0 ? ` − Discount ${naira(discount)}` : ""}
                  </p>
                </div>
              )}
            </>
          )}
        </Panel>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep disabled:opacity-60"
          >
            <Check className="size-4" /> {isSubmitting ? "Enrolling…" : "Enrol student"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

const Field = React.forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function Field({ label, error, ...props }, ref) {
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

const SelectField = React.forwardRef<
  HTMLSelectElement,
  { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>
>(function SelectField({ label, options, ...props }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        ref={ref}
        {...props}
        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </label>
  );
});
