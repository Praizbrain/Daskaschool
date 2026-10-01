import { getRequiredClassInventoryTotal } from "@/lib/inventory-data";
import { supabase } from "@/lib/supabase-client";

/**
 * Represents one effective fee line item for a class, resolved from
 * fee_templates plus class_fee_assignments.
 */
export type EffectiveFee = {
  templateId: string;
  label: string;
  sectionAmount: number;
  effectiveAmount: number;
  isOverride: boolean;
  isActive: boolean;
  allowInstallment: boolean;
  assignmentId: string | null;
};

export async function getEffectiveFeesForClass(
  classId: string,
  section: string,
): Promise<EffectiveFee[]> {
  const [templatesRes, assignmentsRes] = await Promise.all([
    supabase
      .from("fee_templates")
      .select("id, label, amount, allow_installment")
      .eq("section", section)
      .order("label"),
    supabase
      .from("class_fee_assignments")
      .select("id, fee_template_id, amount_override, is_active")
      .eq("class_id", classId),
  ]);

  if (templatesRes.error) throw templatesRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;

  const assignmentByTemplate = new Map(
    (assignmentsRes.data ?? []).map((assignment) => [assignment.fee_template_id, assignment]),
  );

  return (templatesRes.data ?? []).map((template) => {
    const assignment = assignmentByTemplate.get(template.id);
    const sectionAmount = Number(template.amount);
    const isActive = assignment ? assignment.is_active : true;
    const hasOverride = assignment?.amount_override != null;

    return {
      templateId: template.id,
      label: template.label,
      sectionAmount,
      effectiveAmount: hasOverride ? Number(assignment!.amount_override) : sectionAmount,
      isOverride: hasOverride,
      isActive,
      allowInstallment: template.allow_installment,
      assignmentId: assignment?.id ?? null,
    };
  });
}

/**
 * Gross charge per student. It contains active fee templates and inventory
 * explicitly marked Required for the class. Optional inventory is revenue only
 * after it is sold through Record Payment.
 */
export async function getEffectiveFeeTotal(classId: string, section: string): Promise<number> {
  const [fees, requiredInventoryTotal] = await Promise.all([
    getEffectiveFeesForClass(classId, section),
    getRequiredClassInventoryTotal(classId),
  ]);

  return (
    fees.filter((fee) => fee.isActive).reduce((sum, fee) => sum + fee.effectiveAmount, 0) +
    requiredInventoryTotal
  );
}
