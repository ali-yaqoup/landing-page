import Card from "./Card";
import { useLanguage } from "../../context/LanguageContext";
import { useBusiness } from "../../hooks/useBusiness";

function parseDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (typeof value === "string") return new Date(value);
  if (value instanceof Date) return value;
  return null;
}

export default function PeriodCard({ period, summary, onStartNewPeriod, actionLabel }) {
  const { t, language } = useLanguage();
  const { business } = useBusiness();
  const currency = business?.currency || 'SAR';
  const startDate = parseDate(period?.startDate);
  const endDate = parseDate(period?.endDate);

  const finalActionLabel = actionLabel || t('dashboard.startPeriodBtn');

  const label = startDate
    ? startDate.toLocaleString(language === 'ar' ? 'ar-EG' : undefined, { month: "long", year: "numeric" })
    : t('dashboard.noPeriod');

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t('dashboard.periodStatus')}
          </p>
          <h3 style={{ margin: "0.5rem 0 0 0", fontSize: "1.2rem", fontWeight: 700, color: "var(--text-1)" }}>
            {label}
          </h3>
          <p style={{ margin: "0.5rem 0 0 0", color: "var(--text-2)", lineHeight: 1.6 }}>
            {period
              ? `${startDate?.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined) || "—"} ${endDate ? `— ${endDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined)}` : `(${t('dashboard.periodActive')})`}`
              : t('dashboard.noPeriod')}
          </p>
        </div>
        {onStartNewPeriod ? (
          <button 
            type="button" 
            className="btn-primary w-full sm:w-auto sm:min-w-[190px]" 
            onClick={onStartNewPeriod}
          >
            {finalActionLabel}
          </button>
        ) : null}
      </div>

      {summary ? (
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", 
            gap: "1rem", 
            padding: "1rem", 
            background: "var(--sys-bg)", 
            border: "1px solid var(--sys-border)", 
            borderRadius: "var(--radius-sys-lg)" 
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--sys-text-secondary)", fontWeight: 600 }}>{t('dashboard.kpis.revenue')}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#06b6d4" }}>
              {currency} {summary.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--sys-text-secondary)", fontWeight: 600 }}>{t('expenses.category')}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f87171" }}>
              {currency} {summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--sys-text-secondary)", fontWeight: 600 }}>{t('dashboard.kpis.netProfit')}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: summary.profit >= 0 ? "#4ade80" : "#f87171" }}>
              {currency} {summary.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
