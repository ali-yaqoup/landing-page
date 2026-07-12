import { useContext, useEffect, useState } from "react";
import { runTransaction, doc, collection, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { useBusiness } from "../../hooks/useBusiness";
import { useLanguage } from "../../context/LanguageContext";
import Modal from "./Modal";
import toast from "react-hot-toast";

const reasons = ["New Purchase", "Damaged", "Correction", "Other"];

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "—";
}

export default function StockAdjustmentModal({ isOpen, product, business, activePeriod, onClose, onSuccess }) {
  const { user } = useContext(AuthContext);
  const { branches, inventory, activeBranchId } = useBusiness();
  const { language, t } = useLanguage();

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [action, setAction] = useState("increase");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("New Purchase");
  const [busy, setBusy] = useState(false);

  // Set defaults
  useEffect(() => {
    if (isOpen && product) {
      const initialBranch = activeBranchId === "all" ? (branches[0]?.id || "") : activeBranchId;
      setSelectedBranchId(initialBranch);
      
      const initialVariant = product.hasVariants && product.variants?.length > 0 
        ? product.variants[0].id 
        : "base";
      setSelectedVariantId(initialVariant);

      setAction("increase");
      setQuantity("");
      setReason("New Purchase");
      setBusy(false);
    }
  }, [isOpen, product, activeBranchId, branches]);

  // Compute active stock based on selections
  const activeStock = (() => {
    if (!product) return 0;
    const invRecord = inventory.find(
      (inv) => inv.productId === product.id && 
               inv.variantId === (selectedVariantId || "base") && 
               inv.branchId === selectedBranchId
    );
    return invRecord ? invRecord.currentQuantity || 0 : 0;
  })();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!product || !business || !activePeriod || !selectedBranchId) {
      toast.error(language === 'ar' ? "غير قادر على تعديل المخزون حالياً." : "Unable to adjust stock right now.");
      return;
    }

    const amount = parseInt(quantity, 10);
    if (!quantity || Number.isNaN(amount) || amount <= 0) {
      toast.error(language === 'ar' ? "الرجاء إدخال كمية صالحة." : "Please enter a valid quantity.");
      return;
    }

    if (action === "decrease" && amount > activeStock) {
      toast.error(language === 'ar' ? "لا يمكن سحب كمية أكبر من المخزون المتوفر." : "Cannot remove more than available stock.");
      return;
    }

    setBusy(true);

    try {
      const invId = `${product.id}_${selectedVariantId || "base"}_${selectedBranchId}`;
      const invRef = doc(db, `${business.source}/${business.id}/inventory`, invId);
      const movementRef = doc(collection(db, `${business.source}/${business.id}/stock_movements`));
      const type = action === "increase" ? "increase" : "decrease";

      await runTransaction(db, async (transaction) => {
        const invSnapshot = await transaction.get(invRef);
        const currentQty = invSnapshot.exists() ? (invSnapshot.data().currentQuantity || 0) : 0;
        const newQty = type === "increase" ? currentQty + amount : currentQty - amount;

        if (type === "decrease" && newQty < 0) {
          throw new Error("Cannot remove more than available stock.");
        }

        const selectedVariantObj = product.variants?.find(v => v.id === selectedVariantId);
        const variantSuffix = selectedVariantObj ? ` (${selectedVariantObj.name})` : "";

        // Update/Set Inventory
        transaction.set(invRef, {
          productId: product.id,
          variantId: selectedVariantId || "base",
          branchId: selectedBranchId,
          warehouseId: "",
          currentQuantity: newQty,
          reservedQuantity: invSnapshot.exists() ? (invSnapshot.data().reservedQuantity || 0) : 0,
          minimumStock: invSnapshot.exists() ? (invSnapshot.data().minimumStock || 0) : 0,
          maximumStock: invSnapshot.exists() ? (invSnapshot.data().maximumStock || 1000) : 1000,
          lastUpdated: new Date().toISOString(),
        }, { merge: true });

        // Stock movement log
        transaction.set(movementRef, {
          productId: product.id,
          productName: `${product.name}${variantSuffix}`,
          variantId: selectedVariantId || "base",
          branchId: selectedBranchId,
          type,
          quantity: amount,
          previousQuantity: currentQty,
          newQuantity: newQty,
          reason: reason + ` [${branches.find(b => b.id === selectedBranchId)?.name || ""}]`,
          createdAt: serverTimestamp(),
          userId: user?.uid || null,
          periodId: activePeriod.id,
        });
      });

      toast.success(language === 'ar' ? "تم تحديث المخزون بنجاح." : "Stock updated successfully.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to adjust stock.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={language === 'ar' ? "تعديل كمية المخزون" : "Adjust Stock"}>
      {product ? (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          {/* Product Info */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              {language === 'ar' ? "اسم المنتج" : "Product Name"}
            </label>
            <input className="input" type="text" value={product.name} disabled />
          </div>

          {/* Branch Picker */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              {language === 'ar' ? "الفرع المستهدف" : "Target Branch"}
            </label>
            <select
              className="input"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              required
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Variant Picker (conditional) */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div style={{ display: "grid", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
                {language === 'ar' ? "الموديل / اللون / الحجم" : "Variant"}
              </label>
              <select
                className="input"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                required
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.sku || v.barcode || v.id})</option>
                ))}
              </select>
            </div>
          )}

          {/* Current Stock */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              {language === 'ar' ? "المخزون المتوفر في هذا الفرع" : "Current Stock in Selected Branch"}
            </label>
            <input className="input" type="text" value={formatNumber(activeStock)} disabled />
          </div>

          {/* Action Select */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              {language === 'ar' ? "نوع الإجراء" : "Action"}
            </label>
            <select
              className="input"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            >
              <option value="increase">{language === 'ar' ? "إضافة مخزون (+)" : "Add Stock (+)"}</option>
              <option value="decrease">{language === 'ar' ? "سحب مخزون (-)" : "Remove Stock (-)"}</option>
            </select>
          </div>

          {/* Quantity Input */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              {language === 'ar' ? "كمية التعديل" : "Quantity Amount"}
            </label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </div>

          {/* Reason */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              {language === 'ar' ? "السبب" : "Reason"}
            </label>
            <select
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {language === 'ar' 
                    ? item === "New Purchase" ? "شراء جديد" : item === "Damaged" ? "تالف" : item === "Correction" ? "تصحيح جرد" : "أخرى"
                    : item}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? (language === 'ar' ? "جاري الحفظ..." : "Applying…") : (language === 'ar' ? "تأكيد التعديل" : "Confirm Adjustment")}
            </button>
          </div>
        </form>
      ) : (
        <p style={{ color: "var(--text-2)", margin: 0 }}>Select a product to adjust stock.</p>
      )}
    </Modal>
  );
}
