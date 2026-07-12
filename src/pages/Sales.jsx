import React, { useContext, useState } from "react";
import { doc, collection, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { AuthContext } from "../context/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { useSales } from "../hooks/useSales";
import { useCategories } from "../hooks/useCategories";
import { useCustomers } from "../hooks/useCustomers";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import { ShoppingCart, Search, Plus, Minus, Trash2, User, Receipt } from "lucide-react";
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

export default function Sales() {
  const { business, activePeriod, loading: bizLoading, periodLoading } = useBusiness();
  const currency = business?.currency || 'SAR';
  const { user } = useContext(AuthContext);
  const { products, loading: prodLoading } = useProducts();
  const { sales, loading: salesLoading } = useSales();
  const { categories } = useCategories();
  const { customers } = useCustomers();
  const { t, language } = useLanguage();

  // POS State
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discountType, setDiscountType] = useState("flat"); // "flat" or "percent"
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // "Cash", "Card", "Bank"
  const [busy, setBusy] = useState(false);
  const [salesFilter, setSalesFilter] = useState("all"); // "all", "today", "week", "month"

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);

  // Cart operations
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error(t('dashboard.kpis.outOfStock'));
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantityInCart >= product.quantity) {
          toast.error(t('dashboard.widgets.lowStockAlerts'));
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantityInCart: item.quantityInCart + 1 } : item
        );
      }
      return [...prev, { ...product, quantityInCart: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartQty = (productId, amount) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.quantityInCart + amount;
            const originalProd = products.find((p) => p.id === productId);
            
            if (nextQty > originalProd.quantity) {
              toast.error(t('dashboard.widgets.lowStockAlerts'));
              return item;
            }
            return { ...item, quantityInCart: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantityInCart > 0);
    });
  };

  // Math
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0);
  const discountVal = parseFloat(discountValue) || 0;
  const discountAmount =
    discountType === "flat" ? discountVal : (subtotal * discountVal) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // checkout handler
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(t('sales.cart.empty'));
      return;
    }

    if (!activePeriod?.id) {
      toast.error(t('dashboard.noPeriod'));
      return;
    }

    setBusy(true);
    try {
      const invoiceId = "INV-" + Math.floor(100000 + Math.random() * 900000);

      // Run transactional update
      await runTransaction(db, async (transaction) => {
        // Read and verify all products in cart
        const productRefs = cart.map((item) => ({
          ref: doc(db, `${business.source}/${business.id}/products`, item.id),
          cartItem: item,
        }));

        const productSnapshots = await Promise.all(
          productRefs.map(async (p) => {
            const snap = await transaction.get(p.ref);
            return { snap, cartItem: p.cartItem, ref: p.ref };
          })
        );

        // Verify stock sufficiency
        for (const p of productSnapshots) {
          if (!p.snap.exists()) {
            throw new Error(`Product ${p.cartItem.name} does not exist.`);
          }
          const dbQty = p.snap.data().quantity || 0;
          if (dbQty < p.cartItem.quantityInCart) {
            throw new Error(`Insufficient stock for ${p.cartItem.name}! In stock: ${dbQty}`);
          }
        }

        // Apply updates
        for (const p of productSnapshots) {
          const dbQty = p.snap.data().quantity || 0;
          const newQty = dbQty - p.cartItem.quantityInCart;

          // Deduct stock
          transaction.update(p.ref, { quantity: newQty });

          // Prepare sales record reference
          const saleRef = doc(collection(db, `${business.source}/${business.id}/sales`));
          const movementRef = doc(collection(db, `${business.source}/${business.id}/stock_movements`));

          const saleData = {
            productId: p.cartItem.id,
            productName: p.cartItem.name,
            quantity: p.cartItem.quantityInCart,
            total: p.cartItem.price * p.cartItem.quantityInCart,
            cost: p.cartItem.cost,
            periodId: activePeriod.id,
            invoiceId,
            customerId: selectedCustomerId || null,
            customerName: customers.find((c) => c.id === selectedCustomerId)?.name || null,
            paymentMethod,
            discountAllocated: (p.cartItem.price * p.cartItem.quantityInCart / subtotal) * discountAmount,
            createdAt: serverTimestamp(),
          };

          const movementData = {
            productId: p.cartItem.id,
            productName: p.cartItem.name,
            type: "decrease",
            quantity: p.cartItem.quantityInCart,
            previousQuantity: dbQty,
            newQuantity: newQty,
            reason: "POS Order " + invoiceId,
            createdAt: serverTimestamp(),
            userId: user?.uid || null,
            periodId: activePeriod.id,
          };

          transaction.set(saleRef, saleData);
          transaction.set(movementRef, movementData);
        }
      });

      // Show receipt modal
      const customerNameObj = customers.find((c) => c.id === selectedCustomerId);
      setReceiptData({
        invoiceId,
        items: cart.map((i) => ({ ...i })),
        subtotal,
        discountAmount,
        grandTotal,
        paymentMethod,
        customerName: customerNameObj ? customerNameObj.name : t('sales.customer.walkin'),
        customerTier: customerNameObj ? customerNameObj.tier : "Standard",
        createdAt: new Date(),
      });

      toast.success(t('common.success'));
      setCart([]);
      setSelectedCustomerId("");
      setDiscountValue("");
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setBusy(false);
    }
  };

  // Filter products for the catalog
  const catalogProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchSearch && matchCat;
  });

  // Filter logs list
  const now = new Date();
  const filteredSales = sales.filter((s) => {
    if (salesFilter === "all") return true;
    const saleDate = s.createdAt?.toDate();
    if (!saleDate) return true;
    
    if (salesFilter === "today") {
      return saleDate.toDateString() === now.toDateString();
    }
    if (salesFilter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return saleDate >= weekAgo;
    }
    if (salesFilter === "month") {
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);

  if (bizLoading || prodLoading || salesLoading || periodLoading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.sales')}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {language === 'ar'
            ? "معالجة المعاملات السريعة، وتطبيق خصومات الدفع المخصصة، وتسجيل فواتير العملاء، وطباعة الفواتير."
            : "Process fast transactions, apply custom checkout discounts, register customer billing, and print receipts."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Dual Pane POS Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          <div className="pos-columns" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))", gap: "1.5rem" }}>
            
            {/* LEFT PANE: Catalog */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Card style={{ padding: "1.25rem" }}>
                {/* Search & Categories */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search
                      size={16}
                      color="var(--text-3)"
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      className="input"
                      placeholder={language === 'ar' ? "البحث عن العناصر..." : "Search items..."}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                  <select
                    className="input"
                    style={{ maxWidth: 160 }}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">{language === 'ar' ? "جميع الفئات" : "All Categories"}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product Grid */}
                {catalogProducts.length === 0 ? (
                  <div className="empty-state" style={{ padding: "3rem 1rem" }}>
                    <ShoppingCart size={32} />
                    <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: "0.75rem",
                      maxHeight: "450px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {catalogProducts.map((p) => {
                      const outOfStock = p.quantity <= 0;
                      const categoryName = categories.find((c) => c.id === p.categoryId)?.name;
                      const cartItem = cart.find((item) => item.id === p.id);
                      const inCartQty = cartItem ? cartItem.quantityInCart : 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => addToCart(p)}
                          style={{
                            background: outOfStock ? "rgba(0,0,0,0.03)" : "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "0.85rem",
                            cursor: outOfStock ? "not-allowed" : "pointer",
                            position: "relative",
                            opacity: outOfStock ? 0.6 : 1,
                            transition: "all 0.2s",
                          }}
                          className="pos-product-card"
                          onMouseEnter={(e) => {
                            if (!outOfStock) e.currentTarget.style.borderColor = "var(--accent)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                          }}
                        >
                          {inCartQty > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: "-6px",
                                right: "-6px",
                                background: "var(--accent)",
                                color: "#0f172a",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                              }}
                            >
                              {inCartQty}
                            </span>
                          )}

                          <div style={{ width: "100%", height: "90px", borderRadius: "6px", overflow: "hidden", marginBottom: "0.5rem", background: "var(--bg-body)" }}>
                            <img
                              src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              loading="lazy"
                            />
                          </div>

                          <span
                            style={{
                              fontSize: "0.625rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: "var(--text-3)",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {categoryName || t('products.name')}
                          </span>
                          <h3
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              margin: "0 0 0.5rem 0",
                              color: "var(--text-1)",
                              lineHeight: 1.2,
                              height: "2.4em",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {p.name}
                          </h3>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent)" }}>
                              {currency} {p.price.toFixed(2)}
                            </span>
                            <span
                              style={{
                                fontSize: "0.675rem",
                                fontWeight: 600,
                                color: outOfStock ? "#ef4444" : p.quantity < 5 ? "#f59e0b" : "#10b981",
                              }}
                            >
                              {outOfStock ? t('dashboard.kpis.outOfStock') : `${p.quantity} ${language === 'ar' ? 'متبقي' : 'left'}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT PANE: Cart & Checkout */}
            <div>
              <Card style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.25rem" }}>
                <h2
                  style={{
                    margin: "0 0 1rem 0",
                    fontWeight: 700,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--text-1)",
                  }}
                >
                  <ShoppingCart size={18} /> {t('sales.cart.title')}
                </h2>

                {/* Cart Items list */}
                <div
                  style={{
                    flex: 1,
                    minHeight: "180px",
                    maxHeight: "260px",
                    overflowY: "auto",
                    borderBottom: "1px solid var(--border)",
                    marginBottom: "1rem",
                  }}
                >
                  {cart.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "var(--text-3)",
                        gap: 8,
                      }}
                    >
                      <ShoppingCart size={28} />
                      <span style={{ fontSize: "0.8rem" }}>{t('sales.cart.empty')}</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: 4 }}>
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.5rem 0.75rem",
                            background: "var(--bg)",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--text-1)",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.name}
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                              {currency} {item.price.toFixed(2)}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, -1)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--bg-card)",
                                cursor: "pointer",
                                color: "var(--text-2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, width: "16px", textAlign: "center" }}>
                              {item.quantityInCart}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, 1)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--bg-card)",
                                cursor: "pointer",
                                color: "var(--text-2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: 4,
                                marginLeft: 4,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Association */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.25rem" }}>
                    {t('sales.customer.select')}
                  </label>
                  <select
                    className="input"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">{t('sales.customer.walkin')}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.tier} ({c.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discounts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.25rem" }}>
                      {t('sales.checkout.discountType')}
                    </label>
                    <select
                      className="input"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                    >
                      <option value="flat">{t('sales.checkout.flat')} ({currency})</option>
                      <option value="percent">{t('sales.checkout.percent')} (%)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.25rem" }}>
                      {t('expenses.amount')}
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                {/* Payment & Action */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.25rem" }}>
                    {t('sales.receipt.paidVia')}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    {["Cash", "Card", "Bank"].map((mode) => {
                      const displayMode = mode === 'Cash' ? (language === 'ar' ? 'نقدي' : 'Cash') : mode === 'Card' ? (language === 'ar' ? 'بطاقة' : 'Card') : (language === 'ar' ? 'حوالة' : 'Bank');
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMethod(mode)}
                          style={{
                            padding: "0.5rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            background: paymentMethod === mode ? "var(--accent-dim)" : "transparent",
                            color: paymentMethod === mode ? "var(--accent)" : "var(--text-2)",
                            cursor: "pointer",
                          }}
                        >
                          {displayMode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.75rem 0", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-2)" }}>
                    <span>{t('sales.receipt.subtotal')}:</span>
                    <span>{currency} {subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#f87171" }}>
                      <span>{t('sales.receipt.discounts')}:</span>
                      <span>-{currency} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-1)", marginTop: 4 }}>
                    <span>{language === 'ar' ? "المجموع الكلي:" : "Grand Total:"}</span>
                    <span style={{ color: "#4ade80" }}>{currency} {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={busy || cart.length === 0}
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "auto", height: "44px" }}
                >
                  {t('sales.cart.checkout')} ({currency} {grandTotal.toFixed(2)})
                </button>
              </Card>
            </div>
          </div>
        </div>

        {/* Sales Logs */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          {/* Filters & Total Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{t('sales.history.title')}</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { val: "all", lbl: t('sales.history.all') },
                { val: "today", lbl: t('sales.history.today') },
                { val: "week", lbl: t('sales.history.thisWeek') },
                { val: "month", lbl: t('sales.history.thisMonth') },
              ].map(({ val, lbl }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSalesFilter(val)}
                  style={{
                    padding: "0.4rem 0.875rem",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: salesFilter === val ? "var(--accent-dim)" : "transparent",
                    color: salesFilter === val ? "var(--accent)" : "var(--text-2)",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-2)", fontWeight: 500 }}>{language === 'ar' ? 'إجمالي الإيرادات:' : 'Total Revenue:'}</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4ade80" }}>
                {currency} {totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Listing */}
          {filteredSales.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={40} />
              <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
            </div>
          ) : (
            <Table headers={[t('sales.history.date'), t('sales.receipt.invoiceId'), t('products.name'), t('sales.receipt.qty'), t('sales.history.total'), t('sales.receipt.paidVia'), t('sales.receipt.customer')]}>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
                    {sale.createdAt?.toDate().toLocaleString(language === 'ar' ? 'ar-EG' : undefined) || "Just now"}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.85rem" }}>
                    {sale.invoiceId || "—"}
                  </td>
                  <td style={{ fontWeight: 500 }}>{sale.productName}</td>
                  <td>{sale.quantity}</td>
                  <td style={{ color: "#4ade80", fontWeight: 600 }}>{currency} {sale.total.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-blue">{sale.paymentMethod || "Cash"}</span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
                    {sale.customerName ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <User size={10} /> {sale.customerName}
                      </span>
                    ) : (
                      t('sales.customer.walkin')
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {/* Styled Paper Receipt Modal */}
      <Modal isOpen={!!receiptData} onClose={() => setReceiptData(null)} title={language === 'ar' ? "اكتملت عملية البيع" : "Checkout Complete"}>
        {receiptData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                background: "var(--bg)",
                border: "1px dashed var(--border)",
                borderRadius: "12px",
                padding: "1.5rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-1)",
                fontSize: "0.825rem",
                direction: "ltr", // Receipts look best in structured ltr for columns alignment
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.25rem 0", textTransform: "uppercase" }}>
                  {business?.name || "STOCKFLOW ERP"}
                </h3>
                <p style={{ margin: 0, color: "var(--text-3)" }}>ELECTRONIC RECEIPT</p>
                <div style={{ margin: "0.5rem 0", borderBottom: "1px dashed var(--border)" }} />
                <p style={{ margin: "2px 0" }}>Invc ID: {receiptData.invoiceId}</p>
                <p style={{ margin: "2px 0" }}>Date: {receiptData.createdAt.toLocaleDateString()} {receiptData.createdAt.toLocaleTimeString()}</p>
                <p style={{ margin: "2px 0" }}>Billed To: {receiptData.customerName} ({receiptData.customerTier})</p>
              </div>

              <div style={{ borderBottom: "1px dashed var(--border)", margin: "0.75rem 0" }} />

              {/* Items Table */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {receiptData.items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ maxWidth: "65%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {item.name}
                    </div>
                    <div>
                      {item.quantityInCart}x {currency} {item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: "1px dashed var(--border)", margin: "0.75rem 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal:</span>
                  <span>{currency} {receiptData.subtotal.toFixed(2)}</span>
                </div>
                {receiptData.discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
                    <span>Discounts:</span>
                    <span>-{currency} {receiptData.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95rem" }}>
                  <span>GRAND TOTAL:</span>
                  <span style={{ color: "#10b981" }}>{currency} {receiptData.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderBottom: "1px dashed var(--border)", margin: "0.75rem 0" }} />

              <div style={{ textAlign: "center", color: "var(--text-3)" }}>
                <p style={{ margin: "2px 0" }}>Paid via: {receiptData.paymentMethod}</p>
                <p style={{ margin: "4px 0", fontSize: "0.75rem" }}>Thank you for your business!</p>
                <div style={{ fontSize: "1.5rem", letterSpacing: 3, marginTop: 8, opacity: 0.5 }}>||||| | || ||||</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setReceiptData(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                <Receipt size={14} /> {language === 'ar' ? "طباعة الفاتورة" : "Print Receipt"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
