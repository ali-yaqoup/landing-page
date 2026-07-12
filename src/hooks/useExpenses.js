import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useExpenses() {
  const { business, activePeriod } = useBusiness();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/expenses`),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading expenses:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source, activePeriod?.id]);

  return { expenses, loading };
}
