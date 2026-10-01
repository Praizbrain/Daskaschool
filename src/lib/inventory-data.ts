import { supabase } from "@/lib/supabase-client";

export type InventoryCategory =
  "Books" | "Uniform" | "Sportswear" | "Stationery" | "Accessories" | "Other";

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  description: string | null;
  variant: Record<string, string>;
  unitCost: number;
  sellingPrice: number;
  stockCount: number;
  lowStockThreshold: number;
  isActive: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
};

export type ClassInventoryItem = InventoryItem & {
  assignmentId: string;
  isRequired: boolean;
};

export type InventoryTransaction = {
  id: string;
  itemId: string;
  itemName: string;
  transactionType: "sale" | "restock" | "adjustment" | "return";
  quantity: number;
  referenceId: string | null;
  note: string | null;
  recordedBy: string;
  date: string;
};

export type InventorySummary = {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  byCategory: { category: string; count: number; value: number }[];
};

export type CreateInventoryItemInput = {
  name: string;
  category: InventoryItem["category"];
  description: string;
  variant: Record<string, string>;
  unitCost: number;
  sellingPrice: number;
  stockCount: number;
  lowStockThreshold: number;
};

type InventoryRow = {
  id: string;
  name: string;
  category: InventoryCategory;
  description: string | null;
  variant: Record<string, string> | null;
  unit_cost: number;
  selling_price: number;
  stock_count: number;
  low_stock_threshold: number;
  is_active: boolean;
};

function mapItem(row: InventoryRow): InventoryItem {
  const stockCount = Number(row.stock_count);
  const lowStockThreshold = Number(row.low_stock_threshold);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    variant: row.variant ?? {},
    unitCost: Number(row.unit_cost),
    sellingPrice: Number(row.selling_price),
    stockCount,
    lowStockThreshold,
    isActive: row.is_active,
    isLowStock: stockCount <= lowStockThreshold,
    isOutOfStock: stockCount === 0,
  };
}

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      "id, name, category, description, variant, unit_cost, selling_price, stock_count, low_stock_threshold, is_active",
    )
    .order("category")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => mapItem(row as InventoryRow));
}

export async function fetchInventorySummary(): Promise<InventorySummary> {
  const items = await fetchInventoryItems();
  const activeItems = items.filter((item) => item.isActive);
  const categories = new Map<string, { count: number; value: number }>();
  for (const item of activeItems) {
    const entry = categories.get(item.category) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += item.stockCount * item.unitCost;
    categories.set(item.category, entry);
  }
  return {
    totalItems: activeItems.length,
    totalStockValue: activeItems.reduce((sum, item) => sum + item.stockCount * item.unitCost, 0),
    lowStockItems: activeItems.filter((item) => item.isLowStock && !item.isOutOfStock).length,
    outOfStockItems: activeItems.filter((item) => item.isOutOfStock).length,
    byCategory: Array.from(categories, ([category, value]) => ({ category, ...value })),
  };
}

export async function fetchClassInventoryItems(classId: string): Promise<ClassInventoryItem[]> {
  const { data, error } = await supabase
    .from("class_inventory_items")
    .select(
      "id, is_required, inventory_items!inner(id, name, category, description, variant, unit_cost, selling_price, stock_count, low_stock_threshold, is_active)",
    )
    .eq("class_id", classId)
    .eq("inventory_items.is_active", true);
  if (error) throw error;
  return (data ?? []).flatMap((assignment) => {
    const item = assignment.inventory_items;
    if (!item || Array.isArray(item)) return [];
    return [
      {
        ...mapItem(item as InventoryRow),
        assignmentId: assignment.id,
        isRequired: assignment.is_required,
      },
    ];
  });
}

export async function fetchRequiredClassInventoryItems(
  classId: string,
): Promise<ClassInventoryItem[]> {
  const items = await fetchClassInventoryItems(classId);
  return items.filter((item) => item.isRequired);
}

export async function getRequiredClassInventoryTotal(classId: string): Promise<number> {
  const items = await fetchRequiredClassInventoryItems(classId);
  return items.reduce((sum, item) => sum + item.sellingPrice, 0);
}
export async function fetchInventoryTransactions(itemId?: string): Promise<InventoryTransaction[]> {
  let query = supabase
    .from("inventory_transactions")
    .select(
      "id, inventory_item_id, transaction_type, quantity, reference_id, note, recorded_by, created_at, inventory_items(name)",
    )
    .order("created_at", { ascending: false });
  if (itemId) query = query.eq("inventory_item_id", itemId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    itemId: row.inventory_item_id,
    itemName: Array.isArray(row.inventory_items)
      ? (row.inventory_items[0]?.name ?? "Deleted item")
      : ((row.inventory_items as { name?: string } | null)?.name ?? "Deleted item"),
    transactionType: row.transaction_type as InventoryTransaction["transactionType"],
    quantity: Number(row.quantity),
    referenceId: row.reference_id,
    note: row.note,
    recordedBy: row.recorded_by,
    date: row.created_at,
  }));
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      name: input.name,
      category: input.category,
      description: input.description || null,
      variant: input.variant,
      unit_cost: input.unitCost,
      selling_price: input.sellingPrice,
      stock_count: input.stockCount,
      low_stock_threshold: input.lowStockThreshold,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function updateInventoryItem(
  id: string,
  input: Partial<CreateInventoryItemInput> & { isActive?: boolean },
): Promise<void> {
  const changes: Record<string, unknown> = {};
  if (input.name !== undefined) changes.name = input.name;
  if (input.category !== undefined) changes.category = input.category;
  if (input.description !== undefined) changes.description = input.description || null;
  if (input.variant !== undefined) changes.variant = input.variant;
  if (input.unitCost !== undefined) changes.unit_cost = input.unitCost;
  if (input.sellingPrice !== undefined) changes.selling_price = input.sellingPrice;
  if (input.stockCount !== undefined) changes.stock_count = input.stockCount;
  if (input.lowStockThreshold !== undefined) changes.low_stock_threshold = input.lowStockThreshold;
  if (input.isActive !== undefined) changes.is_active = input.isActive;
  const { error } = await supabase.from("inventory_items").update(changes).eq("id", id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error: assignmentsError } = await supabase
    .from("class_inventory_items")
    .delete()
    .eq("inventory_item_id", id);
  if (assignmentsError) throw assignmentsError;

  const { error: transactionsError } = await supabase
    .from("inventory_transactions")
    .delete()
    .eq("inventory_item_id", id);
  if (transactionsError) throw transactionsError;

  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) throw error;
}
export async function restockItem(
  itemId: string,
  quantity: number,
  note: string,
  addedBy: string,
): Promise<void> {
  const { error: stockError } = await supabase.rpc("increment_stock", {
    item_id: itemId,
    qty: quantity,
  });
  if (stockError) throw stockError;
  const { error: transactionError } = await supabase.from("inventory_transactions").insert({
    inventory_item_id: itemId,
    transaction_type: "restock",
    quantity,
    note: note || null,
    recorded_by: addedBy,
  });
  if (transactionError) throw transactionError;
}

export async function assignItemToClass(
  classId: string,
  itemId: string,
  isRequired: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("class_inventory_items")
    .upsert(
      { class_id: classId, inventory_item_id: itemId, is_required: isRequired },
      { onConflict: "class_id,inventory_item_id" },
    );
  if (error) throw error;
}

export async function removeItemFromClass(assignmentId: string): Promise<void> {
  const { error } = await supabase.from("class_inventory_items").delete().eq("id", assignmentId);
  if (error) throw error;
}
