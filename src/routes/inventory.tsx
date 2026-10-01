import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useClasses } from "@/hooks/use-classes";
import {
  useAssignItemToClass,
  useClassInventoryItems,
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventoryItems,
  useInventorySummary,
  useInventoryTransactions,
  useRemoveItemFromClass,
  useRestockItem,
  useUpdateInventoryItem,
} from "@/hooks/use-inventory";
import { AppShell } from "@/components/fin/app-shell";
import { naira } from "@/lib/school-data";
import type {
  CreateInventoryItemInput,
  InventoryCategory,
  InventoryItem,
} from "@/lib/inventory-data";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | DaskaSchool" },
      { name: "description", content: "School inventory catalog and stock movements." },
    ],
  }),
  component: InventoryPage,
});

const categories: InventoryCategory[] = [
  "Books",
  "Uniform",
  "Sportswear",
  "Stationery",
  "Accessories",
  "Other",
];
type Tab = "catalog" | "movements" | "assignments";
type FormState = CreateInventoryItemInput;
const blankForm = (): FormState => ({
  name: "",
  category: "Books",
  description: "",
  variant: {},
  unitCost: 0,
  sellingPrice: 0,
  stockCount: 0,
  lowStockThreshold: 5,
});

function variantText(variant: Record<string, string>) {
  return (
    Object.entries(variant)
      .filter(([key, value]) => key !== "customCategory" && Boolean(value))
      .map(([, value]) => value)
      .join(", ") || "None"
  );
}

function categoryText(item: InventoryItem) {
  return item.category === "Other" && item.variant.customCategory
    ? item.variant.customCategory
    : item.category;
}

function badgeClass(item: InventoryItem) {
  if (item.isOutOfStock) return "bg-destructive/10 text-destructive";
  if (item.isLowStock) return "bg-accent text-accent-foreground";
  return "bg-primary-soft text-primary";
}

function InventoryPage() {
  const { profile } = useAuth();
  const { data: items = [], isLoading: itemsLoading } = useInventoryItems();
  const { data: summary } = useInventorySummary();
  const { data: transactions = [], isLoading: transactionsLoading } = useInventoryTransactions();
  const { data: classes = [] } = useClasses();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const restock = useRestockItem();
  const assignItem = useAssignItemToClass();
  const removeAssignment = useRemoveItemFromClass();
  const [tab, setTab] = useState<Tab>("catalog");
  const [form, setForm] = useState<FormState>(blankForm());
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [movementSearch, setMovementSearch] = useState("");
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [restockNote, setRestockNote] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [assignItemId, setAssignItemId] = useState("");
  const [assignRequired, setAssignRequired] = useState(false);
  const { data: assigned = [], isLoading: assignmentsLoading } =
    useClassInventoryItems(selectedClassId);
  const isAdmin = profile?.role === "super_admin";

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
        const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
        const status = item.isOutOfStock
          ? "Out of Stock"
          : item.isLowStock
            ? "Low Stock"
            : "In Stock";
        return (
          matchesSearch && matchesCategory && (statusFilter === "All" || statusFilter === status)
        );
      }),
    [items, search, categoryFilter, statusFilter],
  );
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.itemName.toLowerCase().includes(movementSearch.trim().toLowerCase()),
  );
  const selectedClass = classes.find((entry) => entry.id === selectedClassId);
  const unassignedItems = items.filter(
    (item) => item.isActive && !assigned.some((entry) => entry.id === item.id),
  );

  const updateVariant = (key: string, value: string) =>
    setForm((current) => ({
      ...current,
      variant: value
        ? { ...current.variant, [key]: value }
        : Object.fromEntries(Object.entries(current.variant).filter(([entry]) => entry !== key)),
    }));
  const startNew = () => {
    setEditing(null);
    setForm(blankForm());
    setFormOpen(true);
  };
  const startEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      variant: item.variant,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      stockCount: item.stockCount,
      lowStockThreshold: item.lowStockThreshold,
    });
    setFormOpen(true);
  };
  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Enter an item name.");
      return;
    }
    if (
      form.unitCost < 0 ||
      form.sellingPrice < 0 ||
      form.stockCount < 0 ||
      form.lowStockThreshold < 0
    ) {
      toast.error("Amounts and stock cannot be negative.");
      return;
    }
    try {
      if (editing) await updateItem.mutateAsync({ id: editing.id, input: form });
      else await createItem.mutateAsync(form);
      toast.success(editing ? "Inventory item updated." : "Inventory item added.");
      setFormOpen(false);
      setEditing(null);
      setForm(blankForm());
    } catch (error) {
      console.error("[Inventory/save]", error);
      toast.error("Couldn't save this inventory item.");
    }
  };
  const submitRestock = async (itemId: string) => {
    if (!profile || restockQuantity <= 0) {
      toast.error("Enter a restock quantity greater than zero.");
      return;
    }
    try {
      await restock.mutateAsync({
        itemId,
        quantity: restockQuantity,
        note: restockNote,
        addedBy: profile.id,
      });
      toast.success("Stock updated.");
      setRestockId(null);
      setRestockQuantity(0);
      setRestockNote("");
    } catch (error) {
      console.error("[Inventory/restock]", error);
      toast.error("Couldn't restock this item.");
    }
  };
  const removeItem = async (item: InventoryItem) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Inventory item deleted.");
    } catch (error) {
      console.error("[Inventory/delete]", error);
      toast.error("Couldn't delete this item. Remove its class assignments first.");
    }
  };
  const assign = async () => {
    if (!selectedClassId || !assignItemId) {
      toast.error("Choose an item to assign.");
      return;
    }
    try {
      await assignItem.mutateAsync({
        classId: selectedClassId,
        itemId: assignItemId,
        isRequired: assignRequired,
      });
      toast.success("Item assigned to class.");
      setAssignItemId("");
      setAssignRequired(false);
    } catch (error) {
      console.error("[Inventory/assign]", error);
      toast.error("Couldn't assign this item.");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="size-6 text-primary" />
              <h1 className="text-2xl font-bold">Inventory</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage items sold to students and keep stock accurate.
            </p>
          </div>
          {isAdmin && tab === "catalog" && (
            <button
              onClick={startNew}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <PackagePlus className="size-4" />
              Add item
            </button>
          )}
        </div>
        <div className="flex border-b border-border" role="tablist">
          {(
            [
              ["catalog", "Catalog"],
              ["movements", "Stock Movements"],
              ["assignments", "Class Assignments"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              role="tab"
              aria-selected={tab === id}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "catalog" && (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total items", summary?.totalItems ?? 0, ""],
                ["Total stock value", naira(summary?.totalStockValue ?? 0), ""],
                [
                  "Low stock items",
                  summary?.lowStockItems ?? 0,
                  "bg-accent text-accent-foreground",
                ],
                [
                  "Out of stock items",
                  summary?.outOfStockItems ?? 0,
                  "bg-destructive/10 text-destructive",
                ],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            {formOpen && (
              <ItemForm
                form={form}
                setForm={setForm}
                updateVariant={updateVariant}
                editing={Boolean(editing)}
                saving={createItem.isPending || updateItem.isPending}
                onCancel={() => {
                  setFormOpen(false);
                  setEditing(null);
                }}
                onSave={() => void save()}
              />
            )}
            <div className="flex flex-wrap gap-3">
              <label className="relative min-w-[16rem] flex-1">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search items"
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                />
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>All</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>All</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    {[
                      "Name",
                      "Category",
                      "Variant",
                      "Selling price",
                      "Stock",
                      "Status",
                      "Actions",
                    ].map((header) => (
                      <th key={header} className="px-4 py-3 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itemsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{item.name}</p>
                          {item.description && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{categoryText(item)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {variantText(item.variant)}
                        </td>
                        <td className="px-4 py-3 font-semibold">{naira(item.sellingPrice)}</td>
                        <td className="px-4 py-3">{item.stockCount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(item)}`}
                          >
                            {item.isOutOfStock
                              ? "Out of Stock"
                              : item.isLowStock
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRestockId(restockId === item.id ? null : item.id)}
                                className="text-xs font-semibold text-primary"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => startEdit(item)}
                                className="text-muted-foreground"
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                onClick={() => void removeItem(item)}
                                className="text-destructive"
                                aria-label={`Delete ${item.name}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          )}
                          {restockId === item.id && (
                            <div className="mt-3 flex gap-2">
                              <input
                                type="number"
                                min="1"
                                value={restockQuantity || ""}
                                onChange={(event) => setRestockQuantity(Number(event.target.value))}
                                placeholder="Qty"
                                className="h-8 w-16 rounded border border-input px-2"
                              />
                              <input
                                value={restockNote}
                                onChange={(event) => setRestockNote(event.target.value)}
                                placeholder="Note"
                                className="h-8 w-28 rounded border border-input px-2"
                              />
                              <button
                                onClick={() => void submitRestock(item.id)}
                                className="text-xs font-semibold text-primary"
                              >
                                Confirm
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  {!itemsLoading && !filteredItems.length && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No inventory items match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "movements" && (
          <section className="space-y-4">
            <label className="relative block max-w-md">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                value={movementSearch}
                onChange={(event) => setMovementSearch(event.target.value)}
                placeholder="Search by item name"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              />
            </label>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    {["Date", "Item", "Type", "Quantity", "Note", "Recorded by"].map((header) => (
                      <th key={header} className="px-4 py-3 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactionsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        Loading movements...
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-4 py-3">
                          {new Date(transaction.date).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold">{transaction.itemName}</td>
                        <td className="px-4 py-3">
                          <MovementBadge type={transaction.transactionType} />
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {transaction.quantity > 0 ? "+" : ""}
                          {transaction.quantity}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {transaction.note ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {transaction.recordedBy}
                        </td>
                      </tr>
                    ))
                  )}
                  {!transactionsLoading && !filteredTransactions.length && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No stock movements yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "assignments" && (
          <section className="max-w-4xl rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="max-w-xl">
              <label className="text-sm font-semibold" htmlFor="inventory-class">
                Select class
              </label>
              <select
                id="inventory-class"
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose a class</option>
                {["KG", "Primary", "JSS", "SS"].map((section) => {
                  const group = classes.filter((entry) => entry.section === section);
                  return group.length ? (
                    <optgroup key={section} label={section}>
                      {group.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </div>
            {!selectedClass ? (
              <p className="mt-8 rounded-md bg-muted p-4 text-sm text-muted-foreground">
                Choose a class to view and manage its inventory items.
              </p>
            ) : (
              <div className="mt-7">
                <h2 className="text-lg font-bold">{selectedClass.name} · Inventory items</h2>
                <div className="mt-5">
                  <h3 className="font-semibold">Assigned items</h3>
                  {assignmentsLoading ? (
                    <p className="mt-3 text-sm text-muted-foreground">Loading assigned items...</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {assigned.map((item) => (
                        <div
                          key={item.assignmentId}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.category} · {variantText(item.variant)} ·{" "}
                              {naira(item.sellingPrice)}
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={item.isRequired}
                                  onChange={(event) =>
                                    void assignItem.mutateAsync({
                                      classId: selectedClassId,
                                      itemId: item.id,
                                      isRequired: event.target.checked,
                                    })
                                  }
                                />
                                Required
                              </label>
                              <button
                                onClick={() =>
                                  void removeAssignment.mutateAsync({
                                    assignmentId: item.assignmentId,
                                    classId: selectedClassId,
                                  })
                                }
                                className="text-sm font-semibold text-destructive"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {!assigned.length && (
                        <p className="text-sm text-muted-foreground">No items assigned yet.</p>
                      )}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="font-semibold">Add item to class</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <select
                        value={assignItemId}
                        onChange={(event) => setAssignItemId(event.target.value)}
                        className="h-10 min-w-64 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select an active item</option>
                        {unassignedItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({variantText(item.variant)})
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={assignRequired}
                          onChange={(event) => setAssignRequired(event.target.checked)}
                        />
                        Required
                      </label>
                      <button
                        onClick={() => void assign()}
                        className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
function MovementBadge({ type }: { type: "sale" | "restock" | "adjustment" | "return" }) {
  const colors = {
    sale: "bg-destructive/10 text-destructive",
    restock: "bg-primary-soft text-primary",
    adjustment: "bg-secondary text-secondary-foreground",
    return: "bg-accent text-accent-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${colors[type]}`}>
      {type}
    </span>
  );
}
function ItemForm({
  form,
  setForm,
  updateVariant,
  editing,
  saving,
  onCancel,
  onSave,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  updateVariant: (key: string, value: string) => void;
  editing: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const change = (key: keyof FormState, value: string | number | InventoryCategory) =>
    setForm((current) => ({ ...current, [key]: value }));
  const level = (
    <select
      value={form.variant.level ?? ""}
      onChange={(event) => updateVariant("level", event.target.value)}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">Select level</option>
      {["KG", "Primary", "JSS", "SS"].map((value) => (
        <option key={value}>{value}</option>
      ))}
    </select>
  );
  const size = (
    <select
      value={form.variant.size ?? ""}
      onChange={(event) => updateVariant("size", event.target.value)}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">Select size</option>
      {["XS", "S", "M", "L", "XL", "XXL"].map((value) => (
        <option key={value}>{value}</option>
      ))}
    </select>
  );
  return (
    <div className="rounded-lg border border-primary/30 bg-card p-5">
      <h2 className="text-lg font-bold">
        {editing ? "Edit inventory item" : "Add inventory item"}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => change("name", event.target.value)}
          placeholder="Item name"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value as InventoryCategory,
              variant: {},
            }))
          }
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        {form.category === "Other" && (
          <input
            value={form.variant.customCategory ?? ""}
            onChange={(event) => updateVariant("customCategory", event.target.value)}
            placeholder="Custom category name"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        )}
        <input
          value={form.description}
          onChange={(event) => change("description", event.target.value)}
          placeholder="Description (optional)"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
        />
        {form.category === "Books" && level}
        {form.category === "Uniform" && (
          <>
            <select
              value={form.variant.gender ?? ""}
              onChange={(event) => updateVariant("gender", event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select gender</option>
              {["Male", "Female", "Unisex"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            {level}
            {size}
          </>
        )}
        {form.category === "Sportswear" && (
          <>
            <select
              value={form.variant.gender ?? ""}
              onChange={(event) => updateVariant("gender", event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select gender</option>
              {["Male", "Female", "Unisex"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            {size}
            <input
              value={form.variant.colour ?? ""}
              onChange={(event) => updateVariant("colour", event.target.value)}
              placeholder="Colour"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </>
        )}
        <NumberInput
          label="Unit cost (₦)"
          value={form.unitCost}
          onChange={(value) => change("unitCost", value)}
        />
        <NumberInput
          label="Selling price (₦)"
          value={form.sellingPrice}
          onChange={(value) => change("sellingPrice", value)}
        />
        <NumberInput
          label="Opening stock count"
          value={form.stockCount}
          onChange={(value) => change("stockCount", value)}
        />
        <NumberInput
          label="Low stock threshold"
          value={form.lowStockThreshold}
          onChange={(value) => change("lowStockThreshold", value)}
        />
      </div>
      <div className="mt-5 flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save item"}
        </button>
        <button
          onClick={onCancel}
          className="h-10 rounded-md border border-border px-4 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type="number"
        min="0"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}
