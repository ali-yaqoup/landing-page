import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { doc, collection, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "../hooks/useBusiness";
import { useProducts } from "../hooks/useProducts";
import { useSales } from "../hooks/useSales";
import { useExpenses } from "../hooks/useExpenses";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import ConfirmModal from "../components/ui/ConfirmModal";
import PeriodCard from "../components/ui/PeriodCard";
import Table from "../components/ui/Table";
import {
  ShoppingCart,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

function StatCard({ label, value, sub, Icon, color, bg }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          <Icon size={16} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
          {value}
        </h3>
        {sub && <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{sub}</span>}
      </div>
    </Card>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <div
        style={{
          width: 36,
          height: 36,
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

export default function Dashboard() {
  const { business, activePeriod, loading: bizLoading, periodLoading } = useBusiness();
  const currency = business?.currency || 'SAR';
  const { products, loading: prodLoading } = useProducts();
  const { sales, loading: salesLoading } = useSales();
  const { expenses, loading: expLoading } = useExpenses();
  const { t, language } = useLanguage();
  const [confirmNewPeriod, setConfirmNewPeriod] = useState(false);
  const [startingPeriod, setStartingPeriod] = useState(false);

  if (bizLoading || periodLoading || prodLoading || salesLoading || expLoading) {
    return <Spinner />;
  }

  // Calculations
  const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  
  // Calculate total costs based on product cost * quantity sold
  const totalCosts = sales.reduce((acc, s) => {
    // Check if the sale document already stored the cost at point-of-sale, fallback to current product cost
    const cost = s.cost !== undefined ? s.cost : (products.find((p) => p.id === s.productId)?.cost || 0);
    return acc + cost * s.quantity;
  }, 0);

  const netProfit = totalSales - totalCosts - totalExpenses;

  // Inventory warnings
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity < 5);
  const outOfStock = products.filter((p) => p.quantity === 0);

  // Filter today's revenue
  const today = new Date().toDateString();
  const todayRevenue = sales
    .filter((s) => s.createdAt?.toDate().toDateString() === today)
    .reduce((acc, s) => acc + (s.total || 0), 0);

  const recentSales = sales.slice(0, 5);

  const handleStartNewPeriod = async () => {
    if (!business) {
      toast.error(t('common.error'));
      return;
    }

    setStartingPeriod(true);
    try {
      const nextPeriodRef = doc(collection(db, `${business.source}/${business.id}/periods`));
      const batch = writeBatch(db);

      if (activePeriod?.id) {
        const currentPeriodRef = doc(db, `${business.source}/${business.id}/periods`, activePeriod.id);
        batch.update(currentPeriodRef, {
          status: "archived",
          endDate: new Date(),
        });
      }

      batch.set(nextPeriodRef, {
        startDate: new Date(),
        status: "active",
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      toast.success(activePeriod?.id ? t('dashboard.newPeriod') : t('common.success'));
      setConfirmNewPeriod(false);
    } catch (err) {
      console.error("Error toggling accounting cycle:", err);
      toast.error(t('common.error'));
    } finally {
      setStartingPeriod(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.dashboard')}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {t('dashboard.subtitle', { businessName: business?.name || t('common.logo') })}
        </p>
      </div>
 
      <PeriodCard
        period={activePeriod}
        summary={{ sales: totalSales, expenses: totalExpenses, profit: netProfit }}
        onStartNewPeriod={() => setConfirmNewPeriod(true)}
      />
   
      <ConfirmModal
        isOpen={confirmNewPeriod}
        title={t('dashboard.createPeriodTitle')}
        message={t('dashboard.noPeriod')}
        confirmLabel={t('dashboard.startPeriodBtn')}
        cancelLabel={t('common.cancel')}
        busy={startingPeriod}
        onConfirm={handleStartNewPeriod}
        onCancel={() => setConfirmNewPeriod(false)}
      />
   
      {/* Analytics Summary */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
        }}
      >
        <StatCard
          label={t('dashboard.kpis.revenue')}
          value={`${currency} ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          Icon={ShoppingCart}
          color="#06b6d4"
          bg="var(--accent-dim)"
          sub={`${t('dashboard.kpis.todaySales')}: ${currency} ${todayRevenue.toFixed(2)}`}
        />
        <StatCard
          label={t('expenses.category')}
          value={`${currency} ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          Icon={Receipt}
          color="#f87171"
          bg="#f871711a"
          sub={`${expenses.length} ${t('expenses.title')}`}
        />
        <StatCard
          label={t('dashboard.kpis.netProfit')}
          value={`${currency} ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          Icon={netProfit >= 0 ? TrendingUp : TrendingDown}
          color={netProfit >= 0 ? "#4ade80" : "#f87171"}
          bg={netProfit >= 0 ? "#4ade801a" : "#f871711a"}
          sub={t('reports.pnl.profitDesc')}
        />
      </div>

      {/* Warnings & Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #fbbf2430",
            background: "#fbbf2410",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <AlertTriangle size={16} color="#fbbf24" />
            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#fbbf24" }}>
              {t('dashboard.widgets.lowStockAlerts')}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {outOfStock.map((p) => (
              <span key={p.id} className="badge badge-red">
                {p.name} ({t('dashboard.kpis.outOfStock')})
              </span>
            ))}
            {lowStock.map((p) => (
              <span key={p.id} className="badge badge-amber">
                {p.name} ({t('products.stock')}: {p.quantity})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Sections Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "1.5rem" }}>
          <Card style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)" }}>
                {t('dashboard.widgets.recentTransactions')}
              </h2>
              <Link
                to="/sales"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t('common.all')} <ArrowRight size={14} />
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <div className="empty-state">
                <ShoppingCart size={32} />
                <p style={{ margin: 0 }}>{t('sales.cart.empty')}</p>
                <Link to="/sales" className="btn-primary" style={{ fontSize: "0.8rem", textDecoration: "none" }}>
                  {t('sales.cart.checkout')}
                </Link>
              </div>
            ) : (
              <Table headers={[t('sales.history.date'), t('products.name'), t('sales.receipt.qty'), t('sales.history.total')]}>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.createdAt?.toDate().toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined) || "—"}</td>
                    <td style={{ fontWeight: 500 }}>{sale.productName}</td>
                    <td>{sale.quantity}</td>
                    <td style={{ color: "#4ade80", fontWeight: 600 }}>{currency} {sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)" }}>
                {t('expenses.title')}
              </h2>
              <Link
                to="/expenses"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t('common.all')} <ArrowRight size={14} />
              </Link>
            </div>

            {expenses.slice(0, 5).length === 0 ? (
              <div className="empty-state">
                <Receipt size={32} />
                <p style={{ margin: 0 }}>{t('common.emptyState')}</p>
                <Link to="/expenses" className="btn-primary" style={{ fontSize: "0.8rem", textDecoration: "none" }}>
                  {t('expenses.add')}
                </Link>
              </div>
            ) : (
              <Table headers={[t('expenses.date'), t('expenses.note'), t('expenses.amount')]}>
                {expenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id}>
                    <td style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
                      {expense.date || expense.createdAt?.toDate().toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined) || "—"}
                    </td>
                    <td style={{ fontWeight: 500 }}>{expense.title}</td>
                    <td style={{ color: "#f87171", fontWeight: 600 }}>{currency} {expense.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <Card style={{ padding: "1.5rem" }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)", marginBottom: "1rem" }}>
            {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { to: "/products", label: t('products.actions.add'), color: "#06b6d4", icon: Plus },
              { to: "/sales", label: t('sales.cart.checkout'), color: "#4ade80", icon: ShoppingCart },
              { to: "/expenses", label: t('expenses.add'), color: "#f87171", icon: Receipt },
            ].map(({ to, label, color, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  color: "var(--text-1)",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <Icon size={16} color={color} />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
