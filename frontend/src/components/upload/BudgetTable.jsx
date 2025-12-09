import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon, CheckIcon } from "../../components/common/icons";
import Pagination from "../../components/common/Pagination";
import ConfirmPopup from "../../components/common/ConfirmPopup";
import SuccessPopup from "../../components/common/SuccessPopup";
import { fetchBudgetsPaginated, updateBudgetById, deleteBudgetById } from "../../api/budgetApi";

const th = "px-3 py-2 text-white text-sm md:text-base font-semibold border-l border-white/20";
const td = "px-3 py-3 text-sm md:text-base border-t border-black/10";

export default function BudgetTable() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const limit = 10;
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmUpdateId, setConfirmUpdateId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");

  const load = async (p=1) => {
    const { items, totalPages } = await fetchBudgetsPaginated(p, limit);
    setRows(items);
    setTotal(totalPages || 1);
  };

  useEffect(() => { load(page); }, [page]);

  const startEdit = (row) => {
    setEditingId(row._id);
    setDraft({
      month: row.month || row.period || "",
      category: row.category,
      budgetAmount: row.amount ?? row.budgetAmount,
      notes: row.notes || "",
    });
  };

  const saveEdit = async (id) => {
    const payload = {
      ...draft,
      budgetAmount: Number(draft.budgetAmount),
    };
    await updateBudgetById(id, payload);
    setEditingId(null);
    setDraft({});
    load(page);
  };
  const requestSave = (id) => setConfirmUpdateId(id);

  const onDelete = async (id) => {
    await deleteBudgetById(id);
    await load(page);
  };
  const requestDelete = (id) => setConfirmDeleteId(id);

  return (
    <section className="mt-12">
      <h3 className="text-lg md:text-xl font-semibold mb-3">Budget table</h3>

      <div className="overflow-x-auto rounded-xl border border-black/10">
        <table className="min-w-[800px] w-full border-collapse">
          <thead>
            <tr className="bg-[#121a6b]">
              <th className={`${th} rounded-tl-xl`}>Month</th>
              <th className={th}>Category</th>
              <th className={th}>Amount</th>
              <th className={th}>Notes</th>
              <th className={`${th} rounded-tr-xl`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6">No data</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r._id}>
                <td className={td}>
                  {editingId === r._id ? (
                    <input value={draft.month || ""} onChange={(e) => setDraft((d) => ({ ...d, month: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    r.month || r.period || "-"
                  )}
                </td>
                <td className={td}>
                  {editingId === r._id ? (
                    <input value={draft.category || ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    r.category
                  )}
                </td>
                <td className={td}>
                  {editingId === r._id ? (
                    <input type="number" value={draft.budgetAmount} onChange={(e) => setDraft((d) => ({ ...d, budgetAmount: e.target.value }))} className="border rounded px-2 py-1 w-full text-right" />
                  ) : (
                    Number(r.amount ?? r.budgetAmount).toLocaleString()
                  )}
                </td>
                <td className={td}>
                  {editingId === r._id ? (
                    <input value={draft.notes || ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    r.notes || "-"
                  )}
                </td>
                <td className={`${td} text-center`}>
                  <div className="flex justify-center gap-3">
                    {editingId === r._id ? (
                      <button title="Save" onClick={() => requestSave(r._id)} className="p-1 rounded hover:bg-black/5"><CheckIcon size={18} /></button>
                    ) : (
                      <button title="Edit" onClick={() => startEdit(r)} className="p-1 rounded hover:bg-black/5"><PencilIcon size={18} /></button>
                    )}
                    <button title="Delete" onClick={() => requestDelete(r._id)} className="p-1 rounded hover:bg-black/5"><TrashIcon size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(total, p + 1))}
      />

      {/* Confirm delete */}
      <ConfirmPopup
        open={!!confirmDeleteId}
        title="Delete record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          const id = confirmDeleteId;
          setConfirmDeleteId(null);
          await onDelete(id);
          setSuccessTitle("Data deleted successfully");
          setShowSuccess(true);
        }}
      />

      {/* Confirm update */}
      <ConfirmPopup
        open={!!confirmUpdateId}
        title="Update data"
        message="Please confirm that you want to save these changes."
        confirmText="Save"
        cancelText="Cancel"
        onCancel={() => setConfirmUpdateId(null)}
        onConfirm={async () => {
          const id = confirmUpdateId;
          setConfirmUpdateId(null);
          await saveEdit(id);
          setSuccessTitle("Data updated successfully");
          setShowSuccess(true);
        }}
      />

      {/* Success toast */}
      <SuccessPopup
        open={showSuccess}
        messageTitle={successTitle || "Success"}
        messageBody="Your changes have been applied successfully."
        durationMs={1500}
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
}
