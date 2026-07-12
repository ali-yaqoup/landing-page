import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useSales() {
  const { business, activePeriod } = useBusiness();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source || !activePeriod?.id) {
      setSales([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/sales`),
      where("periodId", "==", activePeriod.id)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const sortedSales = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });
        setSales(sortedSales);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading sales:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source, activePeriod?.id]);

  return { sales, loading };
}
