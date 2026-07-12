import { useState } from "react";
import { useStockMovements } from "../hooks/useStockMovements";
import { useLanguage } from "../context/LanguageContext";
import StockHistoryTable from "../components/ui/StockHistoryTable";
import Card from "../components/ui/Card";
import { Clock3 } from "lucide-react";

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

export default function StockHistory() {
  const { stockMovements, loading } = useStockMovements();
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState("all");

  const filteredMovements = stockMovements.filter((movement) => {
    if (filter === "all") return true;
    return movement.type === filter;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {language === 'ar' ? "سجل حركة المخزون" : "Stock Movement History"}
        </h1>
        <p className="page-sub" style={{ margin: "0.25rem 0 0 0" }}>
          {language === 'ar'
            ? "مراجعة جميع تسويات المخزون، المشتريات، وتصحيحات الكمية."
            : "Review every inventory adjustment, purchase, and correction."}
        </p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--text-1)" }}>
                {language === 'ar' ? "نشاط المخزون" : "Inventory activity"}
              </h2>
              <p style={{ margin: "0.5rem 0 0 0", color: "var(--text-2)" }}>
                {language === 'ar'
                  ? "يتم تسجيل جميع حركات المخزون تلقائياً في سجل مركزي."
                  : "All stock movements are logged in a central history."}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { val: "all", lbl: language === 'ar' ? "الكل" : "All" },
                { val: "increase", lbl: language === 'ar' ? "زيادة" : "Increase" },
                { val: "decrease", lbl: language === 'ar' ? "نقص" : "Decrease" },
              ].map((option) => (
                <button
                  key={option.val}
                  type="button"
                  onClick={() => setFilter(option.val)}
                  style={{
                    padding: "0.5rem 0.9rem",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: filter === option.val ? "var(--accent-dim)" : "transparent",
                    color: filter === option.val ? "var(--accent)" : "var(--text-2)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {option.lbl}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <Spinner />
        ) : filteredMovements.length === 0 ? (
          <Card>
            <div className="empty-state">
              <Clock3 size={40} />
              <p style={{ fontWeight: 600, margin: 0 }}>{t('common.emptyState')}</p>
            </div>
          </Card>
        ) : (
          <Card>
            <StockHistoryTable movements={filteredMovements} />
          </Card>
        )}
      </div>
    </div>
  );
}
