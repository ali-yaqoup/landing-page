import React, { useState } from "react";
import { doc, addDoc, deleteDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { useCategories } from "../hooks/useCategories";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Pencil, Trash2, FolderOpen, Plus, Search } from "lucide-react";
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

export default function Categories() {
  const { business } = useBusiness();
  const { categories, loading } = useCategories();
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit / Delete states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [updating, setUpdating] = useState(false);
  const [confirmCategory, setConfirmCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, description } = form;

    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, `${business.source}/${business.id}/categories`), {
        name: name.trim(),
        description: description.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success(t('common.success'));
      setForm({ name: "", description: "" });
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description || "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { name, description } = editForm;

    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, `${business.source}/${business.id}/categories`, editingCategory.id), {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success(t('common.success'));
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const requestDelete = (category) => {
    setConfirmCategory(category);
  };

  const confirmDelete = async () => {
    if (!confirmCategory) return;
    setDeleting(true);

    try {
      await deleteDoc(doc(db, `${business.source}/${business.id}/categories`, confirmCategory.id));
      toast.success(t('common.success'));
      setConfirmCategory(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.categories')}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {language === 'ar'
            ? "تنظيم فئات المنتجات في كتالوج مخصص لسهولة تصفية المنتجات في نظام البيع."
            : "Organize your product catalogue into categories for easier tracking and point-of-sale filtering."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Add Category Section */}
        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)", marginBottom: "1rem" }}>
            {language === 'ar' ? "إضافة فئة جديدة" : "Add New Category"}
          </h2>
          <form
            onSubmit={handleAdd}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                {language === 'ar' ? "اسم الفئة" : "Category Name"}
              </label>
              <input
                className="input"
                type="text"
                placeholder={language === 'ar' ? "مثال: مشروبات، إلكترونيات" : "E.g., Beverages, Electronics"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.3rem" }}>
                {t('expenses.note')}
              </label>
              <input
                className="input"
                type="text"
                placeholder={language === 'ar' ? "وصف اختياري" : "Optional description"}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ height: 40, whiteSpace: "nowrap" }}>
              <Plus size={16} /> {language === 'ar' ? "إضافة الفئة" : "Add Category"}
            </button>
          </form>
        </Card>

        {/* Categories Table */}
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
                placeholder={language === 'ar' ? "البحث عن الفئات..." : "Search categories…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={40} />
              <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
            </div>
          ) : (
            <Table headers={[language === 'ar' ? "اسم الفئة" : "Category Name", t('expenses.note'), language === 'ar' ? "إجراءات" : "Actions"]}>
              {filtered.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ color: "var(--text-2)", whiteSpace: "normal" }}>{cat.description || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
                        title={language === 'ar' ? "تعديل" : "Edit"}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(cat)}
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

      {/* Edit Category Modal */}
      <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title={language === 'ar' ? "تعديل الفئة" : "Edit Category"}>
        {editingCategory && (
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.4rem" }}>
                {language === 'ar' ? "اسم الفئة" : "Category Name"}
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
                {t('expenses.note')}
              </label>
              <textarea
                className="input"
                rows={3}
                style={{ resize: "none" }}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditingCategory(null)}
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
        isOpen={!!confirmCategory}
        title={t('products.actions.delete')}
        message={language === 'ar' ? `هل أنت متأكد أنك تريد إزالة الفئة "${confirmCategory?.name}"؟ المنتجات داخل هذه الفئة ستبقى، ولكنها لن تعود مرتبطة بها.` : `Are you sure you want to remove the category "${confirmCategory?.name}"? Products inside this category will remain, but will no longer be linked to it.`}
        confirmLabel={t('products.actions.delete')}
        cancelLabel={t('common.cancel')}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmCategory(null)}
      />
    </div>
  );
}
