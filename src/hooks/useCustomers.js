import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useCustomers() {
  const { business } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/customers`),
      orderBy("name", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading customers:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source]);

  return { customers, loading };
}
