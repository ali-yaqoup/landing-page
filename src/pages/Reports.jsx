import React, { useState } from "react";
import { useBusiness } from "../hooks/useBusiness";
import { useSales } from "../hooks/useSales";
import { useExpenses } from "../hooks/useExpenses";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, PackageOpen, PieChart } from "lucide-react";

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

export default function Reports() {
  const { business } = useBusiness();
  const currency = business?.currency || 'SAR';
  const { sales, loading: salesLoading } = useSales();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { t, language } = useLanguage();

  const [timeframe, setTimeframe] = useState("all"); // "all", "today", "week", "month"

  const now = new Date();

  // Filter lists based on timeframe
  const filteredSales = sales.filter((s) => {
    if (timeframe === "all") return true;
    const date = s.createdAt?.toDate();
    if (!date) return false;

    if (timeframe === "today") {
      return date.toDateString() === now.toDateString();
    }
    if (timeframe === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    if (timeframe === "month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (timeframe === "all") return true;
    const date = e.createdAt?.toDate();
    if (!date) return false;

    if (timeframe === "today") {
      return date.toDateString() === now.toDateString();
    }
    if (timeframe === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    if (timeframe === "month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // KPI Calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCostOfGoodsSold = filteredSales.reduce((sum, s) => sum + ((s.cost || 0) * (s.quantity || 0)), 0);
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const totalOpExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = grossProfit - totalOpExpenses;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Charting Data prep
  // Group sales by day for the line chart (last 7 days if "week" or "all", or last 12 months)
  const getDailySalesData = () => {
    const days = {};
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const shortDay = d.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, { weekday: "short" });
      days[d.toDateString()] = { label: shortDay, value: 0 };
    }

    filteredSales.forEach((s) => {
      const dateStr = s.createdAt?.toDate().toDateString();
      if (days[dateStr]) {
        days[dateStr].value += s.total;
      }
    });

    return Object.values(days);
  };

  const dailySales = getDailySalesData();
  const maxSaleVal = Math.max(...dailySales.map((d) => d.value), 100);

  // Group sales by Category for category contribution chart
  const getCategorySalesData = () => {
    const categoriesMap = {};
    categories.forEach((c) => {
      categoriesMap[c.id] = { name: c.name, revenue: 0 };
    });

    filteredSales.forEach((s) => {
      const prod = products.find((p) => p.id === s.productId);
      if (prod && prod.categoryId && categoriesMap[prod.categoryId]) {
        categoriesMap[prod.categoryId].revenue += s.total;
      } else {
        if (!categoriesMap["uncategorized"]) {
          categoriesMap["uncategorized"] = { name: language === 'ar' ? "غير مصنف" : "Uncategorized", revenue: 0 };
        }
        categoriesMap["uncategorized"].revenue += s.total;
      }
    });

    return Object.values(categoriesMap).filter((c) => c.revenue > 0);
  };

  const categorySales = getCategorySalesData();
  const maxCategoryVal = Math.max(...categorySales.map((c) => c.revenue), 100);

  // Top Selling Products calculations
  const getTopProducts = () => {
    const prodCounts = {};
    filteredSales.forEach((s) => {
      if (!prodCounts[s.productId]) {
        prodCounts[s.productId] = { name: s.productName, qty: 0, revenue: 0, cost: s.cost || 0 };
      }
      prodCounts[s.productId].qty += s.quantity;
      prodCounts[s.productId].revenue += s.total;
    });

    return Object.values(prodCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();

  if (salesLoading || expensesLoading || productsLoading || categoriesLoading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {t('nav.reports')}
          </h1>
          <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
            {language === 'ar'
              ? "تحليل التدفقات النقدية، تكلفة البضائع المباعة، الهوامش التشغيلية، ومخططات صحة الأعمال."
              : "Analyze cash flow, cost of goods sold (COGS), operating margins, and custom business health charts."}
          </p>
        </div>

        {/* Timeframe selector */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { val: "all", lbl: t('sales.history.all') },
            { val: "today", lbl: t('sales.history.today') },
            { val: "week", lbl: t('sales.history.thisWeek') },
            { val: "month", lbl: t('sales.history.thisMonth') },
          ].map(({ val, lbl }) => (
            <button
              key={val}
              type="button"
              onClick={() => setTimeframe(val)}
              className={`filter-btn ${timeframe === val ? "active" : ""}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        
        {/* Revenue */}
        <Card style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" }}>
              {language === 'ar' ? "إجمالي إيرادات المبيعات" : "Total Sales Revenue"}
            </span>
            <div className="stat-value" style={{ margin: "2px 0 0 0" }}>{currency} {totalRevenue.toFixed(2)}</div>
          </div>
        </Card>

        {/* COGS */}
        <Card style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" }}>
              {language === 'ar' ? "تكلفة البضاعة المباعة (COGS)" : "Cost of Goods Sold (COGS)"}
            </span>
            <div className="stat-value" style={{ margin: "2px 0 0 0", color: "#f59e0b" }}>{currency} {totalCostOfGoodsSold.toFixed(2)}</div>
          </div>
        </Card>

        {/* Gross Profit / Margin */}
        <Card style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" }}>
              {language === 'ar' ? "نسبة هامش الربح الإجمالي" : "Gross Margin %"}
            </span>
            <div className="stat-value" style={{ margin: "2px 0 0 0", color: "#10b981" }}>
              {grossMarginPercent.toFixed(1)}%
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginLeft: 6, marginRight: 6 }}>({currency} {grossProfit.toFixed(0)})</span>
            </div>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" }}>
              {language === 'ar' ? "المصاريف التشغيلية" : "Operating Expenses"}
            </span>
            <div className="stat-value" style={{ margin: "2px 0 0 0", color: "#ef4444" }}>{currency} {totalOpExpenses.toFixed(2)}</div>
          </div>
        </Card>
      </div>

      {/* Net Profit Summary Panel */}
      <Card style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent)", background: "var(--bg-sidebar)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-1)" }}>
              {language === 'ar' ? "صافي الدخل الدوري" : "Periodic Net Income"}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-3)" }}>
              {language === 'ar'
                ? "صافي الدخل هو المؤشر الرئيسي للربحية، ويتم حسابه بخصم تكاليف الجملة والمصاريف التشغيلية من المبيعات."
                : "Net Income is the core metric of profitability, calculating Sales Revenue minus wholesale costs and business operating expenses."}
            </p>
          </div>
          <div style={{ textAlign: language === 'ar' ? "left" : "right" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" }}>
              {language === 'ar' ? "صافي الأرباح والهامش" : "NET PROFIT & MARGIN"}
            </span>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: netProfit >= 0 ? "#10b981" : "#ef4444" }}>
              {currency} {netProfit.toFixed(2)} 
              <span style={{ fontSize: "1.1rem", fontWeight: 600, marginLeft: 8, marginRight: 8 }}>({netMarginPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "1.5rem" }}>
        
        {/* Sales Trend Chart */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={16} color="var(--accent)" /> {language === 'ar' ? "اتجاه المبيعات (آخر 7 أيام)" : "Sales Trend (Last 7 Days)"}
          </h3>
          
          <div style={{ height: "220px", display: "flex", alignItems: "flex-end", paddingBottom: "1.5rem", position: "relative" }}>
            {/* Draw Y Axis Gridlines */}
            <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "80%", display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none", zIndex: 0 }}>
              <div style={{ borderBottom: "1px dashed var(--border)", width: "100%", height: 0 }} />
              <div style={{ borderBottom: "1px dashed var(--border)", width: "100%", height: 0 }} />
              <div style={{ borderBottom: "1px dashed var(--border)", width: "100%", height: 0 }} />
            </div>

            {/* Bars container */}
            <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "flex-end", justifyContent: "space-around", zIndex: 1 }}>
              {dailySales.map((day, idx) => {
                const barHeight = `${(day.value / maxSaleVal) * 80}%`;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "12%", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", marginBottom: "4px" }}>
                      {day.value > 0 ? `${currency} ${day.value.toFixed(0)}` : ""}
                    </div>
                    {/* The bar */}
                    <div
                      style={{
                        width: "100%",
                        height: day.value > 0 ? barHeight : "4px",
                        background: "linear-gradient(to top, var(--accent-dim), var(--accent))",
                        borderRadius: "6px 6px 0 0",
                        transition: "all 0.3s ease",
                      }}
                    />
                    <div style={{ fontSize: "0.725rem", color: "var(--text-3)", marginTop: "8px", fontWeight: 500 }}>
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Category Contribution */}
        <Card style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <PieChart size={16} color="var(--accent)" /> {language === 'ar' ? "مساهمة المبيعات حسب الفئة" : "Sales Contribution by Category"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, justifyContent: "center" }}>
            {categorySales.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <PackageOpen size={30} />
                <p style={{ margin: 0, fontSize: "0.8rem" }}>{t('common.emptyState')}</p>
              </div>
            ) : (
              categorySales.map((cat, idx) => {
                const barWidth = `${(cat.revenue / maxCategoryVal) * 100}%`;
                const contributionPct = ((cat.revenue / totalRevenue) * 100).toFixed(0);

                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem", fontWeight: 600 }}>
                      <span style={{ color: "var(--text-2)" }}>{cat.name}</span>
                      <span style={{ color: "var(--text-1)" }}>
                        {currency} {cat.revenue.toFixed(2)} <span style={{ color: "var(--text-3)", fontWeight: 500 }}>({contributionPct}%)</span>
                      </span>
                    </div>
                    {/* Bar Tracker */}
                    <div style={{ width: "100%", height: "10px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: barWidth,
                          height: "100%",
                          background: "var(--accent)",
                          borderRadius: "99px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Top Products & Inventory Alert Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "1.5rem" }}>
        
        {/* Top Products Table */}
        <Card>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={16} color="var(--accent)" /> {language === 'ar' ? "العناصر الأكثر مبيعاً في المخزون" : "Top-Selling Inventory Items"}
          </h3>
          
          {topProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1rem" }}>
              <p style={{ margin: 0, fontSize: "0.8rem" }}>
                {language === 'ar' ? "قم بتسجيل عمليات بيع لنقاط البيع لإنشاء تحليلات وترتيب المبيعات." : "Record POS transactions to generate sales analytics rankings."}
              </p>
            </div>
          ) : (
            <Table headers={[language === 'ar' ? "العنصر" : "Item", language === 'ar' ? "الكمية المباعة" : "Quantity Sold", language === 'ar' ? "الإيرادات المحققة" : "Revenue Generated", language === 'ar' ? "الربح التقديري" : "Est Profit"]}>
              {topProducts.map((p, idx) => {
                const estProfit = p.revenue - (p.cost * p.qty);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.name}</td>
                    <td>{p.qty} {language === 'ar' ? "وحدة" : "units"}</td>
                    <td style={{ fontWeight: 600 }}>{currency} {p.revenue.toFixed(2)}</td>
                    <td style={{ color: estProfit >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                      {currency} {estProfit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>

        {/* Low Stock Watchlist */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <PackageOpen size={16} color="#f59e0b" /> {language === 'ar' ? "قائمة مراقبة المخزون المنخفض" : "Low Stock Watchlist"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, overflowY: "auto", maxHeight: "250px" }}>
            {products.filter((p) => p.quantity < 5).length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--text-3)", fontSize: "0.8rem" }}>
                {language === 'ar' ? "جميع عناصر المخزون متوفرة بشكل جيد!" : "All inventory items are properly stocked!"}
              </div>
            ) : (
              products
                .filter((p) => p.quantity < 5)
                .sort((a, b) => a.quantity - b.quantity)
                .map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-1)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "60%" }}>
                      {p.name}
                    </span>
                    <span className={`badge ${p.quantity === 0 ? "badge-red" : "badge-amber"}`}>
                      {p.quantity === 0 ? t('dashboard.kpis.outOfStock') : `${p.quantity} ${language === 'ar' ? 'متبقي' : 'left'}`}
                    </span>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
