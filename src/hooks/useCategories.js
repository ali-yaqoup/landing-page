import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useCategories() {
  const { business } = useBusiness();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/categories`),
      orderBy("name", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading categories:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source]);

  return { categories, loading };
}
