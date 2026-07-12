import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useStockMovements() {
  const { business } = useBusiness();
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setStockMovements([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/stock_movements`),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setStockMovements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading stock movements:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source]);

  return { stockMovements, loading };
}
