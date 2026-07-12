import React, { useState, useEffect } from "react";
import { doc, addDoc, deleteDoc, updateDoc, collection, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useSuppliers } from "../hooks/useSuppliers";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import StockAdjustmentModal from "../components/ui/StockAdjustmentModal";
import { 
  Pencil, Trash2, Package, Search, Plus, ArrowUpDown, Tag, Grid, List, AlignJustify, Info, X, Upload, Loader
} from "lucide-react";
import toast from "react-hot-toast";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";

// Curated beautiful preset images for fast catalogs
const IMAGE_PRESETS = [
  { name: "T-Shirt / Fashion", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80" },
  { name: "Sneakers / Shoes", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80" },
  { name: "Headphones / Electronics", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80" },
  { name: "Coffee Cup / Cafe", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80" },
  { name: "Bottle / Cosmetics", url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&auto=format&fit=crop&q=80" },
  { name: "Medication / Pharma", url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80" },
  { name: "Grocery / Fresh Fruit", url: "https://images.unsplash.com/photo-1610832958506-ee5633619141?w=400&auto=format&fit=crop&q=80" },
  { name: "Book / Notebook", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80" }
];

function StockBadge({ quantity }) {
  const { t } = useLanguage();
  if (quantity === 0) {
    return <span className="badge badge-red">{t('dashboard.kpis.outOfStock')}</span>;
  }
  if (quantity < 5) {
    return <span className="badge badge-amber">{t('dashboard.widgets.lowStockAlerts')} ({quantity})</span>;
  }
  return <span className="badge badge-green">{quantity} {t('products.stock')}</span>;
}

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

export default function Products() {
  const { 
    business, 
    activePeriod, 
    branches, 
    inventory, 
    displayMode, 
    setDisplayMode 
  } = useBusiness();
  const currency = business?.currency || 'SAR';
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { t, language } = useLanguage();

  // Search, Filters & Pagination
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  // Modals & Busy states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [activeDetailImage, setActiveDetailImage] = useState("");

  // Form states
  const [formTab, setFormTab] = useState("basic"); // basic | images | variants | branchStock
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    description: "",
    image: "",
    gallery: [], // array of image URLs
    price: "",
    cost: "",
    hasVariants: false,
    variants: [], // list of variant objects
    branchStock: {}, // branchId -> { quantity, minStock, maxStock }
  });

  const [editFormTab, setEditFormTab] = useState("basic");
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    description: "",
    image: "",
    gallery: [],
    price: "",
    cost: "",
    hasVariants: false,
    variants: [],
    branchStock: {},
  });

  // Automatically initialize branch stock details for forms when branches load
  useEffect(() => {
    if (branches.length > 0) {
      const initialStock = {};
      branches.forEach((b) => {
        initialStock[b.id] = { quantity: "0", minStock: "2", maxStock: "500" };
      });
      setForm((prev) => ({
        ...prev,
        branchStock: { ...initialStock, ...prev.branchStock },
      }));
    }
  }, [branches]);

  // Gallery URLs temporary inputs
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [editGalleryUrlInput, setEditGalleryUrlInput] = useState("");

  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleFileUpload = async (file, isGallery = false, isEdit = false) => {
    if (!file) return;
    const isPrim = !isGallery;
    if (isPrim) setUploadingPrimary(true);
    else setUploadingGallery(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload server responded with status ${response.status}`);
      }

      const data = await response.json();
      const downloadURL = data.url;

      if (isEdit) {
        if (isPrim) {
          setEditForm(prev => ({ ...prev, image: downloadURL }));
        } else {
          setEditForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), downloadURL] }));
        }
      } else {
        if (isPrim) {
          setForm(prev => ({ ...prev, image: downloadURL }));
        } else {
          setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), downloadURL] }));
        }
      }
      toast.success(language === 'ar' ? "تم رفع الصورة بنجاح!" : "Image uploaded successfully!");
    } catch (error) {
      console.error("Cloudinary upload failed, falling back to local base64:", error);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          if (isEdit) {
            if (isPrim) {
              setEditForm(prev => ({ ...prev, image: base64data }));
            } else {
              setEditForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), base64data] }));
            }
          } else {
            if (isPrim) {
              setForm(prev => ({ ...prev, image: base64data }));
            } else {
              setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), base64data] }));
            }
          }
          toast.success(language === 'ar' ? "تم تحميل الصورة (محلياً)!" : "Image loaded (locally)!");
        };
        reader.readAsDataURL(file);
      } catch (innerErr) {
        console.error("FileReader fallback failed:", innerErr);
        toast.error(language === 'ar' ? "فشل رفع وتحميل الصورة" : "Failed to upload and load image");
      }
    } finally {
      if (isPrim) setUploadingPrimary(false);
      else setUploadingGallery(false);
    }
  };

  const deleteCloudinaryImages = async (urls) => {
    const validUrls = (urls || []).filter(url => url && url.includes("cloudinary.com"));
    if (validUrls.length === 0) return;
    try {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls })
      });
    } catch (e) {
      console.error("Failed to delete Cloudinary images:", validUrls, e);
    }
  };

  // Handling Variants builder in Add Form
  const [variantInput, setVariantInput] = useState({ name: "", sku: "", barcode: "", price: "", cost: "", image: "" });
  const handleAddVariantRow = () => {
    if (!variantInput.name.trim()) {
      toast.error(language === 'ar' ? "الرجاء إدخال اسم الموديل/النوع" : "Please specify variant name");
      return;
    }
    const id = "VAR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const branchStockMap = {};
    branches.forEach(b => {
      branchStockMap[b.id] = "0";
    });

    const newVariant = {
      id,
      name: variantInput.name.trim(),
      sku: variantInput.sku.trim() || `VAR-${id}`,
      barcode: variantInput.barcode.trim(),
      price: variantInput.price ? parseFloat(variantInput.price) : null,
      cost: variantInput.cost ? parseFloat(variantInput.cost) : null,
      image: variantInput.image.trim(),
      branchStock: branchStockMap,
      status: "active"
    };

    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
    setVariantInput({ name: "", sku: "", barcode: "", price: "", cost: "", image: "" });
  };

  const handleRemoveVariantRow = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Handling Variants builder in Edit Form
  const [editVariantInput, setEditVariantInput] = useState({ name: "", sku: "", barcode: "", price: "", cost: "", image: "" });
  const handleAddEditVariantRow = () => {
    if (!editVariantInput.name.trim()) {
      toast.error(language === 'ar' ? "الرجاء إدخال اسم الموديل/النوع" : "Please specify variant name");
      return;
    }
    const id = "VAR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const branchStockMap = {};
    branches.forEach(b => {
      branchStockMap[b.id] = "0";
    });

    const newVariant = {
      id,
      name: editVariantInput.name.trim(),
      sku: editVariantInput.sku.trim() || `VAR-${id}`,
      barcode: editVariantInput.barcode.trim(),
      price: editVariantInput.price ? parseFloat(editVariantInput.price) : null,
      cost: editVariantInput.cost ? parseFloat(editVariantInput.cost) : null,
      image: editVariantInput.image.trim(),
      branchStock: branchStockMap,
      status: "active"
    };

    setEditForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
    setEditVariantInput({ name: "", sku: "", barcode: "", price: "", cost: "", image: "" });
  };

  const handleRemoveEditVariantRow = (index) => {
    setEditForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setSaving(true);
    try {
      // 1. Save base product document
      const productRef = await addDoc(collection(db, `${business.source}/${business.id}/products`), {
        name: form.name.trim(),
        sku: form.sku.trim() || "SKU-" + Math.floor(100000 + Math.random() * 900000),
        barcode: form.barcode.trim(),
        categoryId: form.category || "",
        brand: form.brand.trim(),
        description: form.description.trim(),
        image: form.image.trim() || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200", // fallback
        gallery: form.gallery,
        price: form.price ? parseFloat(form.price) : 0,
        cost: form.cost ? parseFloat(form.cost) : 0,
        hasVariants: form.hasVariants,
        variants: form.hasVariants ? form.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          cost: v.cost,
          image: v.image,
          status: v.status
        })) : [],
        createdAt: serverTimestamp(),
      });

      const productId = productRef.id;

      // 2. Save stock levels per branch to inventory subcollection/normalized collection
      if (form.hasVariants) {
        // Save inventory for each variant
        for (const variant of form.variants) {
          for (const b of branches) {
            const qty = parseInt(variant.branchStock?.[b.id] || "0", 10);
            const invId = `${productId}_${variant.id}_${b.id}`;
            await setDoc(doc(db, `${business.source}/${business.id}/inventory`, invId), {
              productId,
              variantId: variant.id,
              branchId: b.id,
              warehouseId: "",
              currentQuantity: qty,
              reservedQuantity: 0,
              minimumStock: 2,
              maximumStock: 500,
              lastUpdated: new Date().toISOString(),
            });
          }
        }
      } else {
        // Save inventory for base product
        for (const b of branches) {
          const s = form.branchStock[b.id] || { quantity: "0", minStock: "2", maxStock: "500" };
          const invId = `${productId}_base_${b.id}`;
          await setDoc(doc(db, `${business.source}/${business.id}/inventory`, invId), {
            productId,
            variantId: "base",
            branchId: b.id,
            warehouseId: "",
            currentQuantity: parseInt(s.quantity, 10),
            reservedQuantity: 0,
            minimumStock: parseInt(s.minStock, 10),
            maximumStock: parseInt(s.maxStock, 10),
            lastUpdated: new Date().toISOString(),
          });
        }
      }

      toast.success(t('common.success'));
      setForm({
        name: "",
        sku: "",
        barcode: "",
        category: "",
        brand: "",
        description: "",
        image: "",
        gallery: [],
        price: "",
        cost: "",
        hasVariants: false,
        variants: [],
        branchStock: {},
      });
      setAddModalOpen(false);
      setFormTab("basic");
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (product) => {
    // Collect existing branch inventory stock for this product
    const branchStockMap = {};
    branches.forEach((b) => {
      const rec = inventory.find(inv => inv.productId === product.id && inv.branchId === b.id && (inv.variantId === "base" || !inv.variantId));
      branchStockMap[b.id] = {
        quantity: rec ? String(rec.currentQuantity || 0) : "0",
        minStock: rec ? String(rec.minimumStock || 2) : "2",
        maxStock: rec ? String(rec.maximumStock || 500) : "500",
      };
    });

    // Collect variants with their stock
    const loadedVariants = (product.variants || []).map((v) => {
      const vStockMap = {};
      branches.forEach((b) => {
        const vRec = inventory.find(inv => inv.productId === product.id && inv.branchId === b.id && inv.variantId === v.id);
        vStockMap[b.id] = vRec ? String(vRec.currentQuantity || 0) : "0";
      });
      return {
        ...v,
        branchStock: vStockMap
      };
    });

    setEditingProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      category: product.categoryId || "",
      brand: product.brand || "",
      description: product.description || "",
      image: product.image || "",
      gallery: product.gallery || [],
      price: product.price ? product.price.toString() : "0",
      cost: product.cost ? product.cost.toString() : "0",
      hasVariants: !!product.hasVariants,
      variants: loadedVariants,
      branchStock: branchStockMap,
    });
    setEditFormTab("basic");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setUpdating(true);
    try {
      // Find and delete orphaned Cloudinary images to prevent files from being orphaned
      try {
        const oldImages = [editingProduct.image, ...(editingProduct.gallery || [])].filter(Boolean);
        const newImages = [editForm.image, ...(editForm.gallery || [])].filter(Boolean);
        const orphanedImages = oldImages.filter(img => !newImages.includes(img));
        if (orphanedImages.length > 0) {
          await deleteCloudinaryImages(orphanedImages);
        }
      } catch (err) {
        console.error("Failed to clean up orphaned Cloudinary images:", err);
      }

      // 1. Update product base data
      await updateDoc(doc(db, `${business.source}/${business.id}/products`, editingProduct.id), {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        barcode: editForm.barcode.trim(),
        categoryId: editForm.category || "",
        brand: editForm.brand.trim(),
        description: editForm.description.trim(),
        image: editForm.image.trim(),
        gallery: editForm.gallery,
        price: editForm.price ? parseFloat(editForm.price) : 0,
        cost: editForm.cost ? parseFloat(editForm.cost) : 0,
        hasVariants: editForm.hasVariants,
        variants: editForm.hasVariants ? editForm.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          cost: v.cost,
          image: v.image,
          status: v.status
        })) : [],
      });

      const productId = editingProduct.id;

      // 2. Update stock levels per branch
      if (editForm.hasVariants) {
        for (const variant of editForm.variants) {
          for (const b of branches) {
            const qty = parseInt(variant.branchStock?.[b.id] || "0", 10);
            const invId = `${productId}_${variant.id}_${b.id}`;
            await setDoc(doc(db, `${business.source}/${business.id}/inventory`, invId), {
              productId,
              variantId: variant.id,
              branchId: b.id,
              warehouseId: "",
              currentQuantity: qty,
              reservedQuantity: 0,
              minimumStock: 2,
              maximumStock: 500,
              lastUpdated: new Date().toISOString(),
            }, { merge: true });
          }
        }
      } else {
        for (const b of branches) {
          const s = editForm.branchStock[b.id] || { quantity: "0", minStock: "2", maxStock: "500" };
          const invId = `${productId}_base_${b.id}`;
          await setDoc(doc(db, `${business.source}/${business.id}/inventory`, invId), {
            productId,
            variantId: "base",
            branchId: b.id,
            warehouseId: "",
            currentQuantity: parseInt(s.quantity, 10),
            reservedQuantity: 0,
            minimumStock: parseInt(s.minStock, 10),
            maximumStock: parseInt(s.maxStock, 10),
            lastUpdated: new Date().toISOString(),
          }, { merge: true });
        }
      }

      toast.success(t('common.success'));
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const requestDelete = (product) => {
    setConfirmProduct(product);
  };

  const confirmDelete = async () => {
    if (!confirmProduct) return;
    setDeleting(true);

    try {
      // Find and delete all Cloudinary images associated with the deleted product
      try {
        const imagesToDelete = [confirmProduct.image, ...(confirmProduct.gallery || [])].filter(Boolean);
        if (imagesToDelete.length > 0) {
          await deleteCloudinaryImages(imagesToDelete);
        }
      } catch (err) {
        console.error("Failed to delete Cloudinary images on product delete:", err);
      }

      // Delete core product document
      await deleteDoc(doc(db, `${business.source}/${business.id}/products`, confirmProduct.id));
      
      // Clean up associated inventory records
      const associatedInvs = inventory.filter(inv => inv.productId === confirmProduct.id);
      for (const inv of associatedInvs) {
        await deleteDoc(doc(db, `${business.source}/${business.id}/inventory`, inv.id));
      }

      toast.success(t('common.success'));
      setConfirmProduct(null);
    } catch (err) {
      console.error(err);
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
                        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
                        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      filter === "all" ||
      (filter === "in" && p.quantity > 0) ||
      (filter === "out" && p.quantity === 0) ||
      (filter === "low" && p.quantity > 0 && p.quantity < 5);
    const matchCat = categoryFilter === "all" || p.categoryId === categoryFilter;
    const matchSup = supplierFilter === "all" || p.supplierId === supplierFilter;
    return matchSearch && matchFilter && matchCat && matchSup;
  });

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1300px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header section with inline action buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {t('nav.products')}
          </h1>
          <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
            {language === 'ar' 
              ? "إدارة كتالوج المنتجات المركزي والمخزون اللامركزي لجميع الفروع."
              : "Decoupled catalog and decentralised multi-branch inventory tracker."}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddModalOpen(true)}>
          <Plus size={16} /> {t('products.actions.add')}
        </button>
      </div>

      {/* Filters and Layout controls */}
      <Card style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", flex: 1, minWidth: 280 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 240 }}>
              <Search
                size={16}
                color="var(--text-3)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                className="input"
                placeholder={language === 'ar' ? "البحث بالاسم، SKU، الباركود..." : "Search name, SKU, brand, barcode…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>

            {/* Category Filter */}
            <select
              className="input"
              style={{ maxWidth: 160 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">{language === 'ar' ? "جميع الفئات" : "All Categories"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Supplier Filter */}
            <select
              className="input"
              style={{ maxWidth: 160 }}
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="all">{language === 'ar' ? "جميع الموردين" : "All Suppliers"}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Stock status filter tabs */}
            <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-body)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
              {[
                { val: "all", lbl: language === 'ar' ? "الكل" : "All" },
                { val: "in", lbl: language === 'ar' ? "متوفر" : "In Stock" },
                { val: "low", lbl: language === 'ar' ? "منخفض" : "Low" },
                { val: "out", lbl: language === 'ar' ? "نافذ" : "Out" },
              ].map(({ val, lbl }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFilter(val)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: 6,
                    border: "none",
                    background: filter === val ? "var(--bg-card)" : "transparent",
                    color: filter === val ? "var(--accent)" : "var(--text-3)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: filter === val ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Display Mode Selector */}
            <div style={{ display: "flex", gap: "0.25rem", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
              {[
                { val: "image", icon: Grid, title: language === 'ar' ? "عرض الصور" : "Image Grid" },
                { val: "list", icon: List, title: language === 'ar' ? "جدول مبسط" : "Detail List" },
                { val: "compact", icon: AlignJustify, title: language === 'ar' ? "عرض مدمج" : "Compact List" },
              ].map(({ val, icon: Icon, title }) => (
                <button
                  key={val}
                  onClick={() => setDisplayMode(val)}
                  style={{
                    padding: "0.35rem 0.5rem",
                    borderRadius: 6,
                    border: "none",
                    background: displayMode === val ? "var(--accent-dim)" : "transparent",
                    color: displayMode === val ? "var(--accent)" : "var(--text-3)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={title}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Catalog View Container */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: "300px" }}>
          <Package size={48} color="var(--text-3)" />
          <p style={{ fontWeight: 600, color: "var(--text-2)" }}>{t('common.emptyState')}</p>
        </div>
      ) : displayMode === "image" ? (
        // IMAGE GRID MODE
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((product) => {
            const catObj = categories.find((c) => c.id === product.categoryId);

            return (
              <Card key={product.id} style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden", position: "relative" }}>
                {/* Image panel */}
                <div 
                  onClick={() => {
                    setViewingProduct(product);
                    setActiveDetailImage(product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400");
                  }}
                  style={{ width: "100%", height: 160, background: "var(--bg-body)", overflow: "hidden", position: "relative", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <img
                    src={product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                  <div style={{ position: "absolute", top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
                    <StockBadge quantity={product.quantity} />
                  </div>
                </div>

                {/* Product details */}
                <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>
                      {catObj ? catObj.name : t('products.noCategory')}
                    </span>
                    {product.brand && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 500 }}>
                        {product.brand}
                      </span>
                    )}
                  </div>

                  <h3 
                    onClick={() => {
                      setViewingProduct(product);
                      setActiveDetailImage(product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400");
                    }}
                    style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0.4rem 0 0.25rem 0", color: "var(--text-1)", lineHeight: "1.3", flex: 1, cursor: "pointer" }}
                    className="hover:text-accent"
                  >
                    {product.name}
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", margin: "0.75rem 0", padding: "0.5rem 0", borderTop: "1px dashed var(--border)", borderBottom: "1px dashed var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                      <span style={{ color: "var(--text-3)" }}>SKU:</span>
                      <span style={{ fontWeight: 500, color: "var(--text-1)" }} className="font-mono">{product.sku || "—"}</span>
                    </div>
                    {product.barcode && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                        <span style={{ color: "var(--text-3)" }}>Barcode:</span>
                        <span style={{ fontWeight: 500, color: "var(--text-1)" }} className="font-mono">{product.barcode}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{t('products.sellPrice')}</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-1)" }}>
                        {currency} {product.price?.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: "0.35rem 0.5rem", borderRadius: 6 }}
                        onClick={() => setAdjustingProduct(product)}
                        title={language === 'ar' ? "تعديل كمية المخزون" : "Adjust Stock"}
                      >
                        <ArrowUpDown size={14} />
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: "0.35rem 0.5rem", borderRadius: 6 }}
                        onClick={() => handleStartEdit(product)}
                        title={t('products.actions.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-danger-ghost"
                        style={{ padding: "0.35rem 0.5rem", borderRadius: 6 }}
                        onClick={() => requestDelete(product)}
                        title={t('products.actions.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : displayMode === "list" ? (
        // TABLE DETAIL LIST MODE
        <Card style={{ padding: 0 }}>
          <Table headers={[
            language === 'ar' ? "المنتج" : "Product Detail",
            t('products.category') + " / " + language === 'ar' ? "البراند" : "Brand",
            t('products.sellPrice'),
            t('products.buyCost'),
            t('products.margin'),
            t('products.stock'),
            language === 'ar' ? "إجراءات" : "Actions"
          ]}>
            {filtered.map((product) => {
              const margin = product.price - product.cost;
              const catObj = categories.find((c) => c.id === product.categoryId);

              return (
                <tr key={product.id}>
                  <td>
                    <div 
                      onClick={() => {
                        setViewingProduct(product);
                        setActiveDetailImage(product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                    >
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100"}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }}
                        loading="lazy"
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-1)" }} className="hover:text-accent">{product.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-3)", display: "flex", gap: "0.5rem" }} className="font-mono">
                          <span>SKU: {product.sku || "—"}</span>
                          {product.barcode && <span>• B: {product.barcode}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {catObj ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: 3 }}>
                          <Tag size={11} /> {catObj.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{t('products.noCategory')}</span>
                      )}
                      {product.brand && (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-2)", fontWeight: 500 }}>
                          {product.brand}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-1)" }}>{currency} {product.price?.toFixed(2)}</td>
                  <td style={{ color: "var(--text-2)" }}>{currency} {product.cost?.toFixed(2)}</td>
                  <td style={{ color: margin >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                    {currency} {margin?.toFixed(2)}
                  </td>
                  <td>
                    <StockBadge quantity={product.quantity} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setAdjustingProduct(product)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                        title={language === 'ar' ? "تعديل كمية المخزون" : "Adjust Stock"}
                      >
                        <ArrowUpDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(product)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(product)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      ) : (
        // COMPACT HIGH DENSITY WAREHOUSE LIST MODE
        <Card style={{ padding: 0 }}>
          <Table headers={[
            "SKU / Barcode",
            language === 'ar' ? "اسم المنتج" : "Product Item",
            language === 'ar' ? "الفرع الحالي" : "Current Branch Quantity",
            language === 'ar' ? "تفاصيل التسعير" : "Pricing Detail",
            language === 'ar' ? "الهامش" : "Margin",
            language === 'ar' ? "حالة المخزون" : "Stock Status",
            language === 'ar' ? "إجراء" : "Action"
          ]}>
            {filtered.map((product) => {
              const margin = product.price - product.cost;
              return (
                <tr key={product.id} style={{ fontSize: "0.8rem", height: "32px" }}>
                  <td className="font-mono text-xs" style={{ padding: "0.3rem 0.75rem", color: "var(--text-2)" }}>
                    {product.sku || "—"} / {product.barcode || "—"}
                  </td>
                  <td 
                    onClick={() => {
                      setViewingProduct(product);
                      setActiveDetailImage(product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100");
                    }}
                    style={{ padding: "0.3rem 0.75rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100"}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }}
                        loading="lazy"
                      />
                      <span className="hover:text-accent">{product.name} {product.brand ? `[${product.brand}]` : ""}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.3rem 0.75rem", fontWeight: 700 }} className="font-mono">
                    {product.quantity}
                  </td>
                  <td style={{ padding: "0.3rem 0.75rem" }}>
                    <span style={{ color: "var(--text-1)", fontWeight: 600 }}>P: {currency} {product.price?.toFixed(1)}</span>
                    <span style={{ color: "var(--text-3)", marginLeft: "0.5rem" }}>C: {currency} {product.cost?.toFixed(1)}</span>
                  </td>
                  <td style={{ padding: "0.3rem 0.75rem", fontWeight: 600, color: margin >= 0 ? "#4ade80" : "#f87171" }} className="font-mono">
                    {margin >= 0 ? "+" : ""}{margin?.toFixed(1)}
                  </td>
                  <td style={{ padding: "0.3rem 0.75rem" }}>
                    <StockBadge quantity={product.quantity} />
                  </td>
                  <td style={{ padding: "0.3rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setAdjustingProduct(product)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(product)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}

      {/* ADD PRODUCT MULTI-TAB MODAL */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title={t('products.actions.add')} size="large">
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.25rem", gap: "1rem" }}>
          {[
            { id: "basic", label: language === 'ar' ? "التفاصيل الأساسية" : "1. Basic Details" },
            { id: "images", label: language === 'ar' ? "الصور والوسائط" : "2. Images" },
            { id: "variants", label: language === 'ar' ? "الموديلات والخيارات" : "3. Variants Setup" },
            { id: "branchStock", label: language === 'ar' ? "مخزون الفروع" : "4. Branch Stock" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFormTab(t.id)}
              style={{
                padding: "0.5rem 0.25rem 0.75rem 0.25rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                background: "none",
                color: formTab === t.id ? "var(--accent)" : "var(--text-3)",
                borderBottom: formTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* TAB 1: BASIC DETAILS */}
          {formTab === "basic" && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label-sm">{t('products.name')} *</label>
                  <input
                    className="input"
                    type="text"
                    required
                    placeholder={language === 'ar' ? "قميص، هاتف ذكي، كافيه..." : "E.g. Linen shirt, Laptop, Juice…"}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-sm">{language === 'ar' ? "العلامة التجارية (البراند)" : "Brand Name"}</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="E.g. WayTech, Apple, Nike"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
              </div>



              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label-sm">{t('products.category')}</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">{t('products.noCategory')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-sm">{language === 'ar' ? "سعر البيع الافتراضي" : "Default Selling Price"} ({currency})</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label-sm">{language === 'ar' ? "تكلفة الشراء الافتراضية" : "Default Cost Price"} ({currency})</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-sm">{language === 'ar' ? "الوصف" : "Product Description"}</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="E.g. 100% linen, water resistant, etc."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CENTRALIZED IMAGES */}
          {formTab === "images" && (
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div>
                  <label className="label-sm">{language === 'ar' ? "رفع الصورة الرئيسية" : "Upload Primary Image"}</label>
                  <div
                    style={{
                      border: "2px dashed var(--border)",
                      borderRadius: "8px",
                      padding: "1rem",
                      textAlign: "center",
                      background: "var(--bg-body)",
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "border-color 0.15s"
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0], false, false);
                      }
                    }}
                    onClick={() => document.getElementById("primaryFileAdd")?.click()}
                  >
                    <input
                      id="primaryFileAdd"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], false, false);
                        }
                      }}
                    />
                    {uploadingPrimary ? (
                      <Loader className="animate-spin text-accent" size={24} />
                    ) : (
                      <Upload className="text-text-3" size={24} />
                    )}
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)" }}>
                      {uploadingPrimary 
                        ? (language === 'ar' ? "جاري الرفع..." : "Uploading...")
                        : (language === 'ar' ? "اسحب وأسقط أو انقر للرفع" : "Drag & drop or click to upload")}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>
                      PNG, JPG, GIF (Max 5MB)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="label-sm">{language === 'ar' ? "رابط الصورة الرئيسية" : "Primary Image URL"}</label>
                  <input
                    className="input font-mono"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                  {form.image && (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img src={form.image} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-2)", wordBreak: "break-all" }}>{form.image}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preset selector */}
              <div>
                <span className="label-sm" style={{ display: "block", marginBottom: "0.5rem" }}>
                  {language === 'ar' ? "أو اختر صورة جاهزة سريعة لمخزونك:" : "Or pick a beautiful stock image preset:"}
                </span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setForm({ ...form, image: p.url })}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: 8,
                        border: form.image === p.url ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: "var(--bg-body)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "var(--text-2)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <img src={p.url} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gallery List */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label className="label-sm">{language === 'ar' ? "رفع صور إضافية للمعرض" : "Upload Gallery Images"}</label>
                    <div
                      style={{
                        border: "2px dashed var(--border)",
                        borderRadius: "8px",
                        padding: "1rem",
                        textAlign: "center",
                        background: "var(--bg-body)",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "border-color 0.15s"
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileUpload(e.dataTransfer.files[0], true, false);
                        }
                      }}
                      onClick={() => document.getElementById("galleryFileAdd")?.click()}
                    >
                      <input
                        id="galleryFileAdd"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], true, false);
                          }
                        }}
                      />
                      {uploadingGallery ? (
                        <Loader className="animate-spin text-accent" size={24} />
                      ) : (
                        <Upload className="text-text-3" size={24} />
                      )}
                      <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)" }}>
                        {uploadingGallery 
                          ? (language === 'ar' ? "جاري الرفع..." : "Uploading...")
                          : (language === 'ar' ? "اسحب وأسقط أو انقر للرفع للمعرض" : "Drag & drop or click to upload to gallery")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="label-sm">{language === 'ar' ? "أو إضافة بالرابط لمعرض المنتج" : "Or Add Gallery Image by URL"}</label>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                      <input
                        className="input font-mono"
                        type="url"
                        placeholder="https://example.com/gallery1.jpg"
                        value={galleryUrlInput}
                        onChange={(e) => setGalleryUrlInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          if (galleryUrlInput.trim()) {
                            setForm({ ...form, gallery: [...form.gallery, galleryUrlInput.trim()] });
                            setGalleryUrlInput("");
                          }
                        }}
                      >
                        {language === 'ar' ? "إضافة" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>

                {form.gallery.length > 0 && (
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    {form.gallery.map((url, i) => (
                      <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, idx) => idx !== i) })}
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "rgba(0,0,0,0.6)",
                            border: "none",
                            borderRadius: "50%",
                            width: 16,
                            height: 16,
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VARIANTS SETUP */}
          {formTab === "variants" && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  id="hasVariants"
                  checked={form.hasVariants}
                  onChange={(e) => setForm({ ...form, hasVariants: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="hasVariants" style={{ fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", color: "var(--text-1)" }}>
                  {language === 'ar' ? "هذا المنتج لديه موديلات/خيارات متعددة (ألوان، أحجام، إلخ)" : "This product has multiple variants (colours, sizes, models)"}
                </label>
              </div>

              {form.hasVariants && (
                <div style={{ padding: "1rem", background: "var(--bg-body)", borderRadius: 8, display: "grid", gap: "1rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-1)" }}>
                    {language === 'ar' ? "إضافة موديل جديد للجدول:" : "Add Variant Row:"}
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <input
                      className="input"
                      placeholder={language === 'ar' ? "اسم الموديل (مثال: أحمر / L)" : "Variant Name (e.g. Red / Large)"}
                      value={variantInput.name}
                      onChange={(e) => setVariantInput({ ...variantInput, name: e.target.value })}
                    />
                    <input
                      className="input font-mono"
                      placeholder="SKU"
                      value={variantInput.sku}
                      onChange={(e) => setVariantInput({ ...variantInput, sku: e.target.value })}
                    />
                    <input
                      className="input font-mono"
                      placeholder="Barcode"
                      value={variantInput.barcode}
                      onChange={(e) => setVariantInput({ ...variantInput, barcode: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      className="input"
                      type="number"
                      placeholder={language === 'ar' ? "السعر الخاص (اختياري)" : "Variant Price (optional)"}
                      value={variantInput.price}
                      onChange={(e) => setVariantInput({ ...variantInput, price: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      placeholder={language === 'ar' ? "التكلفة الخاصة (اختياري)" : "Variant Cost (optional)"}
                      value={variantInput.cost}
                      onChange={(e) => setVariantInput({ ...variantInput, cost: e.target.value })}
                    />
                    <input
                      className="input font-mono"
                      placeholder={language === 'ar' ? "رابط صورة الموديل (اختياري)" : "Variant Image URL (optional)"}
                      value={variantInput.image}
                      onChange={(e) => setVariantInput({ ...variantInput, image: e.target.value })}
                    />
                    <button type="button" className="btn-primary" onClick={handleAddVariantRow}>
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* List of created variants */}
                  {form.variants.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      <Table headers={["Variant Name", "SKU", "Price / Cost", "Status", "Actions"]}>
                        {form.variants.map((v, idx) => (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 600 }}>{v.name}</td>
                            <td className="font-mono text-xs">{v.sku}</td>
                            <td>
                              <span style={{ color: "var(--accent)", fontWeight: 600 }}>{v.price ? `${currency} ${v.price}` : "Default"}</span>
                              <span style={{ color: "var(--text-3)", marginLeft: "0.5rem" }}>{v.cost ? `(${currency} ${v.cost})` : ""}</span>
                            </td>
                            <td>
                              <span className="badge badge-green">Active</span>
                            </td>
                            <td>
                              <button type="button" className="btn-danger-ghost" style={{ padding: "0.25rem" }} onClick={() => handleRemoveVariantRow(idx)}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BRANCH STOCK LEVELS */}
          {formTab === "branchStock" && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ padding: "0.75rem", background: "var(--accent-dim)", borderRadius: 8, fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Info size={15} />
                <span>
                  {language === 'ar' 
                    ? "يتم تتبع المخزون لكل فرع بشكل منفصل تماماً لتحقيق دقة التوزيع."
                    : "Decoupled inventory structure allows branch-specific stock counts."}
                </span>
              </div>

              {form.hasVariants ? (
                // If product has variants, configure stock per variant per branch!
                <div style={{ display: "grid", gap: "1.25rem" }}>
                  {form.variants.map((v, vIdx) => (
                    <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent)", marginBottom: "0.75rem" }}>
                        Variant Stock: {v.name} ({v.sku})
                      </div>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {branches.map((b) => (
                          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "1rem" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)" }}>{b.name}</span>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              style={{ width: 100, height: 32 }}
                              value={v.branchStock?.[b.id] || "0"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => {
                                  const updatedVars = [...prev.variants];
                                  updatedVars[vIdx].branchStock = {
                                    ...updatedVars[vIdx].branchStock,
                                    [b.id]: val
                                  };
                                  return { ...prev, variants: updatedVars };
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Base product branch stock levels config
                <div style={{ display: "grid", gap: "1rem" }}>
                  {branches.map((b) => {
                    const s = form.branchStock[b.id] || { quantity: "0", minStock: "2", maxStock: "500" };
                    return (
                      <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "1rem", display: "grid", gap: "0.75rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-1)" }}>{b.name}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                          <div>
                            <label className="label-sm">{t('products.stock')}</label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={s.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  branchStock: {
                                    ...prev.branchStock,
                                    [b.id]: { ...s, quantity: val }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="label-sm">Min Stock</label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={s.minStock}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  branchStock: {
                                    ...prev.branchStock,
                                    [b.id]: { ...s, minStock: val }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="label-sm">Max Stock</label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={s.maxStock}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  branchStock: {
                                    ...prev.branchStock,
                                    [b.id]: { ...s, maxStock: val }
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal bottom buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setAddModalOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (language === 'ar' ? "جاري الحفظ..." : "Saving Product…") : t('products.actions.add')}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MULTI-TAB MODAL */}
      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title={t('products.actions.edit')} size="large">
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.25rem", gap: "1rem" }}>
          {[
            { id: "basic", label: language === 'ar' ? "التفاصيل الأساسية" : "1. Basic Details" },
            { id: "images", label: language === 'ar' ? "الصور والوسائط" : "2. Images" },
            { id: "variants", label: language === 'ar' ? "الموديلات والخيارات" : "3. Variants Setup" },
            { id: "branchStock", label: language === 'ar' ? "مخزون الفروع" : "4. Branch Stock" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setEditFormTab(t.id)}
              style={{
                padding: "0.5rem 0.25rem 0.75rem 0.25rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                background: "none",
                color: editFormTab === t.id ? "var(--accent)" : "var(--text-3)",
                borderBottom: editFormTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {editingProduct && (
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* EDIT TAB 1: BASIC DETAILS */}
            {editFormTab === "basic" && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="label-sm">{t('products.name')} *</label>
                    <input
                      className="input"
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-sm">{language === 'ar' ? "العلامة التجارية (البراند)" : "Brand Name"}</label>
                    <input
                      className="input"
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    />
                  </div>
                </div>



                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="label-sm">{t('products.category')}</label>
                    <select
                      className="input"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="">{t('products.noCategory')}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm">{language === 'ar' ? "سعر البيع" : "Selling Price"} ({currency})</label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="label-sm">{language === 'ar' ? "تكلفة الشراء" : "Cost Price"} ({currency})</label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.cost}
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-sm">{language === 'ar' ? "الوصف" : "Product Description"}</label>
                    <input
                      className="input"
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EDIT TAB 2: IMAGES */}
            {editFormTab === "images" && (
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label className="label-sm">{language === 'ar' ? "رفع الصورة الرئيسية" : "Upload Primary Image"}</label>
                    <div
                      style={{
                        border: "2px dashed var(--border)",
                        borderRadius: "8px",
                        padding: "1rem",
                        textAlign: "center",
                        background: "var(--bg-body)",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "border-color 0.15s"
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileUpload(e.dataTransfer.files[0], false, true);
                        }
                      }}
                      onClick={() => document.getElementById("primaryFileEdit")?.click()}
                    >
                      <input
                        id="primaryFileEdit"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], false, true);
                          }
                        }}
                      />
                      {uploadingPrimary ? (
                        <Loader className="animate-spin text-accent" size={24} />
                      ) : (
                        <Upload className="text-text-3" size={24} />
                      )}
                      <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)" }}>
                        {uploadingPrimary 
                          ? (language === 'ar' ? "جاري الرفع..." : "Uploading...")
                          : (language === 'ar' ? "اسحب وأسقط أو انقر للرفع" : "Drag & drop or click to upload")}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>
                        PNG, JPG, GIF (Max 5MB)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="label-sm">{language === 'ar' ? "رابط الصورة الرئيسية" : "Primary Image URL"}</label>
                    <input
                      className="input font-mono"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    />
                    {editForm.image && (
                      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <img src={editForm.image} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-2)", wordBreak: "break-all" }}>{editForm.image}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <span className="label-sm" style={{ display: "block", marginBottom: "0.5rem" }}>
                    {language === 'ar' ? "تغيير سريع للصورة باستخدام النماذج الجاهزة:" : "Change fast using high-quality preset URLs:"}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, image: p.url })}
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: 8,
                          border: editForm.image === p.url ? "2px solid var(--accent)" : "1px solid var(--border)",
                          background: "var(--bg-body)",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--text-2)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <img src={p.url} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gallery List */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label className="label-sm">{language === 'ar' ? "رفع صور إضافية للمعرض" : "Upload Gallery Images"}</label>
                      <div
                        style={{
                          border: "2px dashed var(--border)",
                          borderRadius: "8px",
                          padding: "1rem",
                          textAlign: "center",
                          background: "var(--bg-body)",
                          cursor: "pointer",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.5rem",
                          transition: "border-color 0.15s"
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileUpload(e.dataTransfer.files[0], true, true);
                          }
                        }}
                        onClick={() => document.getElementById("galleryFileEdit")?.click()}
                      >
                        <input
                          id="galleryFileEdit"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0], true, true);
                            }
                          }}
                        />
                        {uploadingGallery ? (
                          <Loader className="animate-spin text-accent" size={24} />
                        ) : (
                          <Upload className="text-text-3" size={24} />
                        )}
                        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)" }}>
                          {uploadingGallery 
                            ? (language === 'ar' ? "جاري الرفع..." : "Uploading...")
                            : (language === 'ar' ? "اسحب وأسقط أو انقر للرفع للمعرض" : "Drag & drop or click to upload to gallery")}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="label-sm">{language === 'ar' ? "أو إضافة بالرابط لمعرض المنتج" : "Or Add Gallery Image by URL"}</label>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                        <input
                          className="input font-mono"
                          type="url"
                          placeholder="https://example.com/gallery1.jpg"
                          value={editGalleryUrlInput}
                          onChange={(e) => setEditGalleryUrlInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            if (editGalleryUrlInput.trim()) {
                              setEditForm({ ...editForm, gallery: [...editForm.gallery, editGalleryUrlInput.trim()] });
                              setEditGalleryUrlInput("");
                            }
                          }}
                        >
                          {language === 'ar' ? "إضافة" : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {editForm.gallery && editForm.gallery.length > 0 && (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                      {editForm.gallery.map((url, i) => (
                        <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                          <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, gallery: editForm.gallery.filter((_, idx) => idx !== i) })}
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              background: "rgba(0,0,0,0.6)",
                              border: "none",
                              borderRadius: "50%",
                              width: 16,
                              height: 16,
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDIT TAB 3: VARIANTS */}
            {editFormTab === "variants" && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="checkbox"
                    id="editHasVariants"
                    checked={editForm.hasVariants}
                    onChange={(e) => setEditForm({ ...editForm, hasVariants: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="editHasVariants" style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-1)" }}>
                    {language === 'ar' ? "هذا المنتج لديه موديلات/خيارات متعددة (ألوان، أحجام، إلخ)" : "This product has multiple variants (colours, sizes, models)"}
                  </label>
                </div>

                {editForm.hasVariants && (
                  <div style={{ padding: "1rem", background: "var(--bg-body)", borderRadius: 8, display: "grid", gap: "1rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-1)" }}>
                      {language === 'ar' ? "إضافة موديل جديد للجدول:" : "Add Variant Row:"}
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <input
                        className="input"
                        placeholder="Variant Name"
                        value={editVariantInput.name}
                        onChange={(e) => setEditVariantInput({ ...editVariantInput, name: e.target.value })}
                      />
                      <input
                        className="input font-mono"
                        placeholder="SKU"
                        value={editVariantInput.sku}
                        onChange={(e) => setEditVariantInput({ ...editVariantInput, sku: e.target.value })}
                      />
                      <input
                        className="input font-mono"
                        placeholder="Barcode"
                        value={editVariantInput.barcode}
                        onChange={(e) => setEditVariantInput({ ...editVariantInput, barcode: e.target.value })}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        className="input"
                        type="number"
                        placeholder="Price"
                        value={editVariantInput.price}
                        onChange={(e) => setEditVariantInput({ ...editVariantInput, price: e.target.value })}
                      />
                      <input
                        className="input"
                        type="number"
                        placeholder="Cost"
                        value={editVariantInput.cost}
                        onChange={(e) => setEditVariantInput({ ...editVariantInput, cost: e.target.value })}
                      />
                      <input
                        className="input font-mono"
                        placeholder="Image URL"
                        value={editVariantInput.image}
                        onChange={(e) => setEditVariantInput({ ...editVariantInput, image: e.target.value })}
                      />
                      <button type="button" className="btn-primary" onClick={handleAddEditVariantRow}>
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* List of variants */}
                    {editForm.variants.length > 0 && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                        <Table headers={["Variant Name", "SKU", "Price / Cost", "Status", "Actions"]}>
                          {editForm.variants.map((v, idx) => (
                            <tr key={v.id}>
                              <td style={{ fontWeight: 600 }}>{v.name}</td>
                              <td className="font-mono text-xs">{v.sku}</td>
                              <td>
                                <span style={{ color: "var(--accent)", fontWeight: 600 }}>{v.price ? `${currency} ${v.price}` : "Default"}</span>
                                <span style={{ color: "var(--text-3)", marginLeft: "0.5rem" }}>{v.cost ? `(${currency} ${v.cost})` : ""}</span>
                              </td>
                              <td>
                                <span className="badge badge-green">Active</span>
                              </td>
                              <td>
                                <button type="button" className="btn-danger-ghost" style={{ padding: "0.25rem" }} onClick={() => handleRemoveEditVariantRow(idx)}>
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* EDIT TAB 4: BRANCH STOCK LEVELS */}
            {editFormTab === "branchStock" && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ padding: "0.75rem", background: "var(--accent-dim)", borderRadius: 8, fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Info size={15} />
                  <span>
                    {language === 'ar' 
                      ? "اضبط مستويات المخزون الحالي والمخزون الحرج لكل فرع."
                      : "Adjust current physical quantities and warning levels for all locations."}
                  </span>
                </div>

                {editForm.hasVariants ? (
                  <div style={{ display: "grid", gap: "1.25rem" }}>
                    {editForm.variants.map((v, vIdx) => (
                      <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent)", marginBottom: "0.75rem" }}>
                          Variant Stock: {v.name} ({v.sku})
                        </div>
                        <div style={{ display: "grid", gap: "0.5rem" }}>
                          {branches.map((b) => (
                            <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "1rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)" }}>{b.name}</span>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                style={{ width: 100, height: 32 }}
                                value={v.branchStock?.[b.id] || "0"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditForm(prev => {
                                    const updatedVars = [...prev.variants];
                                    updatedVars[vIdx].branchStock = {
                                      ...updatedVars[vIdx].branchStock,
                                      [b.id]: val
                                    };
                                    return { ...prev, variants: updatedVars };
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {branches.map((b) => {
                      const s = editForm.branchStock[b.id] || { quantity: "0", minStock: "2", maxStock: "500" };
                      return (
                        <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "1rem", display: "grid", gap: "0.75rem" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-1)" }}>{b.name}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                            <div>
                              <label className="label-sm">{t('products.stock')}</label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                value={s.quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditForm(prev => ({
                                    ...prev,
                                    branchStock: {
                                      ...prev.branchStock,
                                      [b.id]: { ...s, quantity: val }
                                    }
                                  }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="label-sm">Min Stock</label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                value={s.minStock}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditForm(prev => ({
                                    ...prev,
                                    branchStock: {
                                      ...prev.branchStock,
                                      [b.id]: { ...s, minStock: val }
                                    }
                                  }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="label-sm">Max Stock</label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                value={s.maxStock}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditForm(prev => ({
                                    ...prev,
                                    branchStock: {
                                      ...prev.branchStock,
                                      [b.id]: { ...s, maxStock: val }
                                    }
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Edit Bottom actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditingProduct(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updating}
              >
                {updating ? (language === 'ar' ? "جاري الحفظ..." : "Saving Changes…") : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Stock adjustment popup */}
      <StockAdjustmentModal
        isOpen={!!adjustingProduct}
        product={adjustingProduct}
        business={business}
        activePeriod={activePeriod}
        onClose={() => setAdjustingProduct(null)}
      />

      {/* Confirm deletion popup */}
      <ConfirmModal
        isOpen={!!confirmProduct}
        title={t('products.actions.delete')}
        message={language === 'ar' ? `هل أنت متأكد أنك تريد حذف المنتج ${confirmProduct?.name}؟ سيتم حذف جميع سجلات المخزون التابعة له أيضاً ولا يمكن التراجع عن ذلك.` : `Are you sure you want to remove ${confirmProduct?.name}? This will permanently delete its stock records across all locations.`}
        confirmLabel={t('products.actions.delete')}
        cancelLabel={t('common.cancel')}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmProduct(null)}
      />

      {/* Product details popup */}
      <Modal 
        isOpen={!!viewingProduct} 
        onClose={() => {
          setViewingProduct(null);
          setActiveDetailImage("");
        }} 
        title={language === 'ar' ? "تفاصيل المنتج" : "Product Details"} 
        size="large"
      >
        {viewingProduct && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", padding: "0.5rem 0" }}>
            {/* Left side: Images (Primary and Gallery) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ width: "100%", height: "260px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-body)" }}>
                <img
                  src={activeDetailImage || viewingProduct.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"}
                  alt={viewingProduct.name}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              {/* Gallery List (including primary image as the first thumbnail) */}
              {((viewingProduct.gallery && viewingProduct.gallery.length > 0) || viewingProduct.image) && (
                <div>
                  <span className="label-sm" style={{ display: "block", marginBottom: "0.5rem" }}>
                    {language === 'ar' ? "معرض الصور" : "Image Gallery"}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {/* Include primary image first */}
                    {[viewingProduct.image, ...(viewingProduct.gallery || [])].filter(Boolean).map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveDetailImage(imgUrl)}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: activeDetailImage === imgUrl ? "2px solid var(--accent)" : "1px solid var(--border)",
                          background: "var(--bg-card)",
                          padding: 0,
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <img src={imgUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Information */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <span className="badge badge-accent" style={{ textTransform: "uppercase", fontSize: "0.65rem", padding: "0.2rem 0.5rem", fontWeight: 700 }}>
                  {categories.find(c => c.id === viewingProduct.categoryId)?.name || t('products.noCategory')}
                </span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-1)", marginTop: "0.5rem", marginBottom: 0 }}>
                  {viewingProduct.name}
                </h2>
                {viewingProduct.brand && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-3)", margin: "0.25rem 0 0 0", fontWeight: 500 }}>
                    {language === 'ar' ? "العلامة التجارية: " : "Brand: "}{viewingProduct.brand}
                  </p>
                )}
              </div>

              {viewingProduct.description && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    {language === 'ar' ? "الوصف" : "Description"}
                  </span>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-2)", marginTop: "0.25rem", marginBottom: 0, lineHeight: "1.5" }}>
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>SKU (رمز المخزن)</span>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-1)", marginTop: "0.15rem" }} className="font-mono">
                    {viewingProduct.sku || "—"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>Barcode (الباركود)</span>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-1)", marginTop: "0.15rem" }} className="font-mono">
                    {viewingProduct.barcode || "—"}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>{t('products.sellPrice')}</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)", marginTop: "0.15rem" }}>
                    {currency} {viewingProduct.price?.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>{t('products.buyCost')}</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-2)", marginTop: "0.15rem" }}>
                    {currency} {viewingProduct.cost?.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>{t('products.margin')}</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: (viewingProduct.price - viewingProduct.cost) >= 0 ? "#4ade80" : "#f87171", marginTop: "0.15rem" }}>
                    {currency} {(viewingProduct.price - viewingProduct.cost)?.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>
                    {language === 'ar' ? "إجمالي المخزون الحالي" : "Total Current Stock"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                    <StockBadge quantity={viewingProduct.quantity} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                    onClick={() => {
                      setViewingProduct(null);
                      handleStartEdit(viewingProduct);
                    }}
                  >
                    {t('products.actions.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                    onClick={() => {
                      setViewingProduct(null);
                      setActiveDetailImage("");
                    }}
                  >
                    {language === 'ar' ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
