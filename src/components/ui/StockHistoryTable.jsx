import Table from "./Table";
import { useLanguage } from "../../context/LanguageContext";

export default function StockHistoryTable({ movements }) {
  const { language } = useLanguage();

  return (
    <Table headers={[
      language === 'ar' ? "التاريخ" : "Date", 
      language === 'ar' ? "المنتج" : "Product", 
      language === 'ar' ? "الإجراء" : "Action", 
      language === 'ar' ? "الكمية" : "Quantity", 
      language === 'ar' ? "السبب" : "Reason"
    ]}>
      {movements.map((movement) => {
        const date = movement.createdAt?.toDate ? movement.createdAt.toDate() : new Date(movement.createdAt || undefined);
        return (
          <tr key={movement.id}>
            <td style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
              {date ? date.toLocaleString(language === 'ar' ? 'ar-EG' : undefined) : "—"}
            </td>
            <td style={{ fontWeight: 500 }}>{movement.productName}</td>
            <td style={{ color: movement.type === "increase" ? "#4ade80" : "#f87171", fontWeight: 600 }}>
              {movement.type === "increase" 
                ? (language === 'ar' ? "زيادة" : "Increase") 
                : (language === 'ar' ? "نقص" : "Decrease")}
            </td>
            <td style={{ fontWeight: 600 }}>{movement.quantity}</td>
            <td style={{ color: "var(--text-2)" }}>{movement.reason || "—"}</td>
          </tr>
        );
      })}
    </Table>
  );
}
