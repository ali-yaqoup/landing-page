import React, { useState } from "react";
import { doc, collection, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { useExpenses } from "../hooks/useExpenses";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Receipt, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "6rem 0" }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Expenses() {
  const { business, activePeriod, periodLoading } = useBusiness();
  const currency = business?.currency || 'SAR';
  const { expenses, loading } = useExpenses();
  const { t, language } = useLanguage();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [busy, setBusy] = useState(false);
  const [confirmExpense, setConfirmExpense] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      toast.error(t('common.error'));
      return;
    }
    const amt = parseFloat(amount);
    if (amt <= 0) {
      toast.error(t('common.error'));
      return;
    }

    if (!activePeriod?.id) {
      setBusy(false);
      toast.error(t('dashboard.noPeriod'));
      return;
    }

    setBusy(true);
    try {
      // Parse custom selected date or default to now
      const expenseDate = date ? new Date(date) : new Date();

      await addDoc(collection(db, `${business.source}/${business.id}/expenses`), {
        title: title.trim(),
        amount: amt,
        date: date || new Date().toISOString().split("T")[0],
        periodId: activePeriod.id,
        createdAt: Timestamp.fromDate(expenseDate),
      });

      toast.success(t('common.success'));
      setTitle("");
      setAmount("");
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const requestDeleteExpense = (expense) => {
    setConfirmExpense(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!confirmExpense) return;

    setDeleting(true);

    try {
      await deleteDoc(
        doc(db, `${business.source}/${business.id}/expenses`, confirmExpense.id)
      );

      toast.success(t('common.success'));
      setConfirmExpense(null);
    } catch (err) {
      console.error(err);
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  if (loading || periodLoading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.expenses')}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {language === 'ar'
            ? "تسجيل المصاريف المتكررة، الفواتير، والتكاليف المتنوعة للمنشأة."
            : "Log recurring overheads, bills, and miscellaneous expenses."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Log Expense Form */}
        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)", marginBottom: "1rem" }}>
            {language === 'ar' ? "تسجيل مصاريف الأعمال" : "Log Business Expense"}
          </h2>
          <form
            onSubmit={handleAddExpense}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                {t('expenses.title')}
              </label>
              <input
                className="input"
                type="text"
                placeholder={language === 'ar' ? "مثال: إيجار المكتب، استضافة السحابة" : "e.g. Office Rent, Cloud hosting"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                {t('expenses.amount')} ({currency})
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                {language === 'ar' ? "تاريخ المصروف" : "Expense Date"}
              </label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={busy} style={{ height: 40, whiteSpace: "nowrap" }}>
              <Plus size={16} /> {language === 'ar' ? "تسجيل المصروف" : "Log Expense"}
            </button>
          </form>
        </Card>

        {/* Expenses List */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)" }}>
              {language === 'ar' ? "سجل المصاريف التاريخي" : "Expense Log History"}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-2)", fontWeight: 500 }}>{language === 'ar' ? "إجمالي التدفقات الخارجة:" : "Total Outflow:"}</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f87171" }}>
                {currency} {totalExpenses.toFixed(2)}
              </span>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <Receipt size={40} />
              <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
            </div>
          ) : (
            <Table headers={[language === 'ar' ? "تاريخ المصروف" : "Expense Date", language === 'ar' ? "العنوان" : "Title", t('expenses.amount'), language === 'ar' ? "إجراءات" : "Actions"]}>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
                    {expense.date || expense.createdAt?.toDate().toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined) || "—"}
                  </td>
                  <td style={{ fontWeight: 500 }}>{expense.title}</td>
                  <td style={{ color: "#f87171", fontWeight: 600 }}>-{currency} {expense.amount.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => requestDeleteExpense(expense)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
                      title={language === 'ar' ? "حذف" : "Delete"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!confirmExpense}
        title={t('products.actions.delete')}
        message={language === 'ar' ? "هل أنت متأكد أنك تريد حذف هذا المصروف؟" : "Are you sure you want to delete this expense?"}
        confirmLabel={t('products.actions.delete')}
        cancelLabel={t('common.cancel')}
        busy={deleting}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setConfirmExpense(null)}
      />
    </div>
  );
}
