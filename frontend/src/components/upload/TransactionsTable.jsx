import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon, CheckIcon } from "../../components/common/icons";
import Pagination from "../../components/common/Pagination";
import ConfirmPopup from "../../components/common/ConfirmPopup";
import SuccessPopup from "../../components/common/SuccessPopup";
import { fetchTransactionsPaginated, deleteTransactionById, updateTransactionById } from "../../api/transactionApi";

const thCls = "px-3 py-2 text-white text-sm md:text-base font-semibold border-l border-white/20";
const tdCls = "px-3 py-3 text-sm md:text-base border-t border-black/10";

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
};

export default function TransactionsTable() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotal] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmUpdateId, setConfirmUpdateId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { items, totalPages: tp } = await fetchTransactionsPaginated(p, limit);
      setRows(items);
      setTotal(tp || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const onDelete = async (id) => {
    await deleteTransactionById(id);
    await load(page);
  };

  const requestDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setDraft({
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
      type: row.type,
      amount: row.amount,
      category: row.category,
      paymentMethod: row.paymentMethod,
      status: row.status,
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : "",
      notes: row.notes || "",
    });
  };

  const saveEdit = async (id) => {
    const payload = {
      ...draft,
      amount: Number(draft.amount),
      date: draft.date ? new Date(draft.date) : undefined,
      dueDate: draft.dueDate ? new Date(draft.dueDate) : undefined,
    };
    await updateTransactionById(id, payload);
    setEditingId(null);
    setDraft({});
    load(page);
  };

  const requestSave = (id) => {
    setConfirmUpdateId(id);
  };

  return (
    <section className="mt-12">
      <h3 className="text-lg md:text-xl font-semibold mb-3">Transactions table</h3>

      <div className="overflow-x-auto rounded-xl border border-black/10">
        <table className="min-w-[800px] w-full border-collapse">
          <thead>
            <tr className="bg-[#121a6b]">
              <th className={`${thCls} rounded-tl-xl`}>Date</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Amount</th>
              <th className={thCls}>Category</th>
              <th className={thCls}>Payments</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Due Date</th>
              <th className={thCls}>Notes</th>
              <th className={`${thCls} rounded-tr-xl`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading && (
              <tr><td colSpan={9} className="text-center py-6">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} className="text-center py-6">No data</td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r._id}>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <input type="date" value={draft.date || ""} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    formatDate(r.date)
                  )}
                </td>
                <td className={tdCls} style={{ textTransform: 'capitalize' }}>
                  {editingId === r._id ? (
                    <select value={draft.type || ""} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} className="border rounded px-2 py-1 w-full">
                      <option value="income">income</option>
                      <option value="expense">expense</option>
                    </select>
                  ) : (
                    r.type
                  )}
                </td>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <input type="number" value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} className="border rounded px-2 py-1 w-full text-right" />
                  ) : (
                    Number(r.amount).toLocaleString()
                  )}
                </td>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <input value={draft.category || ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    r.category
                  )}
                </td>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <input value={draft.paymentMethod || ""} onChange={(e) => setDraft((d) => ({ ...d, paymentMethod: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    r.paymentMethod
                  )}
                </td>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <select value={draft.status || ""} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} className="border rounded px-2 py-1 w-full">
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    r.status
                  )}
                </td>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <input type="date" value={draft.dueDate || ""} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    formatDate(r.dueDate)
                  )}
                </td>
                <td className={tdCls}>
                  {editingId === r._id ? (
                    <input value={draft.notes || ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                  ) : (
                    r.notes || "-"
                  )}
                </td>
                <td className={`${tdCls} text-center`}>
                  <div className="flex justify-center gap-3">
                    {editingId === r._id ? (
                      <button title="Save" onClick={() => requestSave(r._id)} className="p-1 rounded hover:bg-black/5">
                        <CheckIcon size={18} />
                      </button>
                    ) : (
                      <button title="Edit" onClick={() => startEdit(r)} className="p-1 rounded hover:bg-black/5">
                        <PencilIcon size={18} />
                      </button>
                    )}
                    <button title="Delete" onClick={() => requestDelete(r._id)} className="p-1 rounded hover:bg-black/5">
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
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
