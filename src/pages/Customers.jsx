import React, { useState } from "react";
import { doc, addDoc, deleteDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { useCustomers } from "../hooks/useCustomers";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Pencil, Trash2, Users, Plus, Search, Mail, Phone, Tag } from "lucide-react";
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

export default function Customers() {
  const { business } = useBusiness();
  const { customers, loading } = useCustomers();
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", tier: "Standard" });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit / Delete states
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", notes: "", tier: "Standard" });
  const [updating, setUpdating] = useState(false);
  const [confirmCustomer, setConfirmCustomer] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, email, phone, notes, tier } = form;

    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, `${business.source}/${business.id}/customers`), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        tier,
        createdAt: serverTimestamp(),
      });
      toast.success(t('common.success'));
      setForm({ name: "", email: "", phone: "", notes: "", tier: "Standard" });
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
      tier: customer.tier || "Standard",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { name, email, phone, notes, tier } = editForm;

    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, `${business.source}/${business.id}/customers`, editingCustomer.id), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        tier,
      });
      toast.success(t('common.success'));
      setEditingCustomer(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const requestDelete = (customer) => {
    setConfirmCustomer(customer);
  };

  const confirmDelete = async () => {
    if (!confirmCustomer) return;
    setDeleting(true);

    try {
      await deleteDoc(doc(db, `${business.source}/${business.id}/customers`, confirmCustomer.id));
      toast.success(t('common.success'));
      setConfirmCustomer(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const getTierLabel = (tierVal) => {
    if (language === 'ar') {
      if (tierVal === "Standard") return "عميل عادي";
      if (tierVal === "VIP") return "عميل مميز (VIP)";
      if (tierVal === "Wholesale") return "شريك جملة";
      if (tierVal === "Employee") return "خصم موظف";
    }
    return tierVal;
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.customers')}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {language === 'ar'
            ? "إنشاء وإدارة حسابات وملفات العملاء لتسهيل تتبع المبيعات ونقاط الولاء."
            : "Create and manage customer profiles to streamline point-of-sale record keeping and trace loyalty."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Add Customer Section */}
        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)", marginBottom: "1rem" }}>
            {language === 'ar' ? "إضافة عميل جديد" : "Add New Customer"}
          </h2>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "اسم العميل" : "Customer Name"}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={language === 'ar' ? "مثال: ريان العتيبي" : "E.g. Rayan Otaibi"}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "مستوى الولاء" : "Loyalty Tier"}
                </label>
                <select
                  className="input"
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                >
                  <option value="Standard">{language === 'ar' ? "عميل عادي" : "Standard Client"}</option>
                  <option value="VIP">{language === 'ar' ? "عميل مميز (VIP)" : "VIP (High Value)"}</option>
                  <option value="Wholesale">{language === 'ar' ? "شريك جملة" : "Wholesale Partner"}</option>
                  <option value="Employee">{language === 'ar' ? "خصم موظف" : "Employee Discount"}</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="client@gmail.com"
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
                  placeholder="+966 5x xxx xxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                  {language === 'ar' ? "ملاحظات الولاء / معلومات التوصيل" : "Loyalty Notes / Delivery Info"}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={language === 'ar' ? "تفاصيل العنوان أو شروط الخصم الإضافية" : "Address details or extra notes"}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ height: 40, whiteSpace: "nowrap" }}>
                <Plus size={16} /> {language === 'ar' ? "إضافة العميل" : "Add Customer"}
              </button>
            </div>
          </form>
        </Card>

        {/* Listing Card */}
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
                placeholder={language === 'ar' ? "البحث عن العملاء..." : "Search customers…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Users size={40} />
              <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
            </div>
          ) : (
            <Table headers={[language === 'ar' ? "اسم العميل" : "Customer Name", language === 'ar' ? "فئة الولاء" : "Loyalty Tier", language === 'ar' ? "معلومات الاتصال" : "Contact Info", language === 'ar' ? "ملاحظات" : "Loyalty Notes", language === 'ar' ? "إجراءات" : "Actions"]}>
              {filtered.map((cust) => {
                let badgeClass = "badge-green";
                if (cust.tier === "VIP") badgeClass = "badge-amber";
                if (cust.tier === "Wholesale") badgeClass = "badge-blue";
                if (cust.tier === "Employee") badgeClass = "badge-red";

                return (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cust.name}</div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        <Tag size={10} style={{ marginRight: 4, marginLeft: 4 }} /> {getTierLabel(cust.tier)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {cust.email && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Mail size={12} /> {cust.email}
                          </span>
                        )}
                        {cust.phone && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={12} /> {cust.phone}
                          </span>
                        )}
                        {!cust.email && !cust.phone && "—"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-2)", whiteSpace: "normal", fontSize: "0.8rem" }}>
                      {cust.notes || "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cust)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
                          title={language === 'ar' ? "تعديل" : "Edit"}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(cust)}
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
                );
              })}
            </Table>
          )}
        </Card>
      </div>

      {/* Edit Customer Modal */}
      <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title={language === 'ar' ? "تعديل ملف العميل" : "Edit Customer Profile"}>
        {editingCustomer && (
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                  {language === 'ar' ? "اسم العميل" : "Customer Name"}
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
                  {language === 'ar' ? "مستوى الولاء" : "Loyalty Tier"}
                </label>
                <select
                  className="input"
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                >
                  <option value="Standard">{language === 'ar' ? "عميل عادي" : "Standard Client"}</option>
                  <option value="VIP">{language === 'ar' ? "عميل مميز (VIP)" : "VIP (High Value)"}</option>
                  <option value="Wholesale">{language === 'ar' ? "شريك جملة" : "Wholesale Partner"}</option>
                  <option value="Employee">{language === 'ar' ? "خصم موظف" : "Employee Discount"}</option>
                </select>
              </div>
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
                {language === 'ar' ? "ملاحظات الولاء / معلومات التوصيل" : "Loyalty Notes / Delivery Info"}
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
                onClick={() => setEditingCustomer(null)}
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
        isOpen={!!confirmCustomer}
        title={t('products.actions.delete')}
        message={language === 'ar' ? `هل أنت متأكد أنك تريد إزالة ملف العميل "${confirmCustomer?.name}"؟` : `Are you sure you want to remove the customer profile for "${confirmCustomer?.name}"?`}
        confirmLabel={t('products.actions.delete')}
        cancelLabel={t('common.cancel')}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmCustomer(null)}
      />
    </div>
  );
}
