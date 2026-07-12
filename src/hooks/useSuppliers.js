import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useSuppliers() {
  const { business } = useBusiness();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/suppliers`),
      orderBy("name", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading suppliers:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source]);

  return { suppliers, loading };
}
