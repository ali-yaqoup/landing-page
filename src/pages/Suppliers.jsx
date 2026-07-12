import React, { useState } from "react";
import { doc, addDoc, deleteDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { useSuppliers } from "../hooks/useSuppliers";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Pencil, Trash2, Truck, Plus, Search, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";

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

export default function Suppliers() {
  const { business } = useBusiness();
  const { suppliers, loading } = useSuppliers();
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", notes: "" });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit / Delete states
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", contact: "", email: "", phone: "", notes: "" });
  const [updating, setUpdating] = useState(false);
  const [confirmSupplier, setConfirmSupplier] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, contact, email, phone, notes } = form;

    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, `${business.source}/${business.id}/suppliers`), {
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success(t('common.success'));
      setForm({ name: "", contact: "", email: "", phone: "", notes: "" });
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contact: supplier.contact || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      notes: supplier.notes || "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { name, contact, email, phone, notes } = editForm;

    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, `${business.source}/${business.id}/suppliers`, editingSupplier.id), {
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      });
      toast.success(t('common.success'));
      setEditingSupplier(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const requestDelete = (supplier) => {
    setConfirmSupplier(supplier);
  };

  const confirmDelete = async () => {
    if (!confirmSupplier) return;
    setDeleting(true);

    try {
      await deleteDoc(doc(db, `${business.source}/${business.id}/suppliers`, confirmSupplier.id));
      toast.success(t('common.success'));
      setConfirmSupplier(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.suppliers')}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {language === 'ar'
            ? "تسجيل وإدارة دليل موردي الجملة وربط المشتريات بالمخزون."
            : "Log and manage your wholesale supplier directory to trace purchases and track deliveries."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Add Supplier Section */}
        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)", marginBottom: "1rem" }}>
            {language === 'ar' ? "إضافة مورد جديد" : "Add New Supplier"}
          </h2>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "اسم الشركة" : "Company Name"}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={language === 'ar' ? "مثال: مصنع الرياض للتعبئة" : "E.g. Riyadh Bottling Corp"}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "الشخص المسؤول" : "Contact Person"}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={language === 'ar' ? "مثال: أحمد محمد" : "E.g. Ahmad Mohammad"}
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "الهاتف" : "Phone"}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="+966 50 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "العنوان والملاحظات" : "Address & Notes"}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={language === 'ar' ? "العنوان الفعلي أو شروط التوريد" : "Physical address or supply terms"}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ height: 40, whiteSpace: "nowrap" }}>
                <Plus size={16} /> {language === 'ar' ? "إضافة المورد" : "Add Supplier"}
              </button>
            </div>
          </form>
        </Card>

        {/* Suppliers List Card */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
              <Search
                size={16}
                color="var(--text-3)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                className="input"
                placeholder={language === 'ar' ? "البحث عن الموردين..." : "Search suppliers…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Truck size={40} />
              <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
            </div>
          ) : (
            <Table headers={[language === 'ar' ? "اسم المورد" : "Company Name", language === 'ar' ? "الشخص المسؤول" : "Contact Person", language === 'ar' ? "البريد / الهاتف" : "Email / Phone", t('expenses.note'), language === 'ar' ? "إجراءات" : "Actions"]}>
              {filtered.map((sup) => (
                <tr key={sup.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sup.name}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{sup.contact || "—"}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {sup.email && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Mail size={12} /> {sup.email}
                        </span>
                      )}
                      {sup.phone && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={12} /> {sup.phone}
                        </span>
                      )}
                      {!sup.email && !sup.phone && "—"}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-2)", whiteSpace: "normal", fontSize: "0.8rem" }}>
                    {sup.notes || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sup)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
                        title={language === 'ar' ? "تعديل" : "Edit"}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(sup)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
                        title={language === 'ar' ? "حذف" : "Delete"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {/* Edit Supplier Modal */}
      <Modal isOpen={!!editingSupplier} onClose={() => setEditingSupplier(null)} title={language === 'ar' ? "تعديل بيانات المورد" : "Edit Supplier Details"}>
        {editingSupplier && (
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                {language === 'ar' ? "اسم الشركة" : "Company Name"}
              </label>
              <input
                className="input"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                {language === 'ar' ? "الشخص المسؤول" : "Contact Person"}
              </label>
              <input
                className="input"
                type="text"
                value={editForm.contact}
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                  {language === 'ar' ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  className="input"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                  {language === 'ar' ? "الهاتف" : "Phone"}
                </label>
                <input
                  className="input"
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                {language === 'ar' ? "العنوان والملاحظات" : "Address & Notes"}
              </label>
              <textarea
                className="input"
                rows={3}
                style={{ resize: "none" }}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditingSupplier(null)}
                style={{ padding: "0.5rem 1rem" }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updating}
                style={{ padding: "0.5rem 1.25rem" }}
              >
                {updating ? (language === 'ar' ? "جاري الحفظ..." : "Saving Changes…") : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!confirmSupplier}
        title={t('products.actions.delete')}
        message={language === 'ar' ? `هل أنت متأكد أنك تريد إزالة تفاصيل المورد "${confirmSupplier?.name}"؟` : `Are you sure you want to remove the supplier details for "${confirmSupplier?.name}"?`}
        confirmLabel={t('products.actions.delete')}
        cancelLabel={t('common.cancel')}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmSupplier(null)}
      />
    </div>
  );
}
