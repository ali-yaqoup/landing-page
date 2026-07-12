import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBusiness } from "./useBusiness";

export function useProducts() {
  const { business, inventory, activeBranchId, activeWarehouseId } = useBusiness();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${business.source}/${business.id}/products`),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading products:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [business?.id, business?.source]);

  // Compute enriched products with branch/warehouse stock
  const enrichedProducts = products.map((p) => {
    // 1. Calculate base product quantity
    const matchingInv = inventory.filter((inv) => {
      const matchProd = inv.productId === p.id && (inv.variantId === "base" || !inv.variantId);
      const matchBranch = activeBranchId === "all" || inv.branchId === activeBranchId;
      const matchWarehouse = activeWarehouseId === "all" || inv.warehouseId === activeWarehouseId;
      return matchProd && matchBranch && matchWarehouse;
    });

    const totalQty = matchingInv.reduce((sum, inv) => sum + (inv.currentQuantity || 0), 0);

    // 2. Enrich variants
    const enrichedVariants = (p.variants || []).map((v) => {
      const vMatchingInv = inventory.filter((inv) => {
        const matchProd = inv.productId === p.id && inv.variantId === v.id;
        const matchBranch = activeBranchId === "all" || inv.branchId === activeBranchId;
        const matchWarehouse = activeWarehouseId === "all" || inv.warehouseId === activeWarehouseId;
        return matchProd && matchBranch && matchWarehouse;
      });
      const vQty = vMatchingInv.reduce((sum, inv) => sum + (inv.currentQuantity || 0), 0);
      return {
        ...v,
        quantity: vQty,
      };
    });

    // If the product has variants, its total quantity is the sum of its active variants' quantities!
    const finalQuantity = p.hasVariants
      ? enrichedVariants.reduce((sum, v) => sum + (v.quantity || 0), 0)
      : totalQty;

    return {
      ...p,
      quantity: finalQuantity,
      variants: enrichedVariants,
    };
  });

  return { products: enrichedProducts, rawProducts: products, loading };
}
