import { createContext, useContext, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, collection, addDoc, setDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db, getMyBusiness } from "../lib/firebase";
import { AuthContext } from "./AuthContext";

export const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const creatingPeriodRef = useRef(false);

  // New multi-branch, multi-warehouse, inventory & display mode state
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [activeBranchId, setActiveBranchIdState] = useState(() => {
    return localStorage.getItem("activeBranchId") || "all";
  });
  const [activeWarehouseId, setActiveWarehouseIdState] = useState(() => {
    return localStorage.getItem("activeWarehouseId") || "all";
  });
  const [displayMode, setDisplayModeState] = useState(() => {
    return localStorage.getItem("displayMode") || "image";
  });

  const setActiveBranchId = (id) => {
    setActiveBranchIdState(id);
    localStorage.setItem("activeBranchId", id);
  };

  const setActiveWarehouseId = (id) => {
    setActiveWarehouseIdState(id);
    localStorage.setItem("activeWarehouseId", id);
  };

  const setDisplayMode = (mode) => {
    setDisplayModeState(mode);
    localStorage.setItem("displayMode", mode);
  };

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    let unsub = () => {};

    const initBusiness = async () => {
      try {
        setLoading(true);
        let activeBiz = await getMyBusiness(user.uid);

        // Auto-create if no business doc is found (failsafe)
        if (!activeBiz) {
          const newRef = await addDoc(collection(db, "businesses"), {
            name: "My Business",
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
          activeBiz = {
            id: newRef.id,
            name: "My Business",
            source: "businesses",
          };
        }

        // Set up real-time subscription to the resolved business doc
        unsub = onSnapshot(
          doc(db, activeBiz.source, activeBiz.id),
          (docSnap) => {
            if (docSnap.exists()) {
              setBusiness({
                id: docSnap.id,
                source: activeBiz.source,
                ...docSnap.data(),
              });
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error subscribing to business doc:", err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error in BusinessProvider init:", err);
        setLoading(false);
      }
    };

    initBusiness();

    return () => unsub();
  }, [user]);

  // Real-time listener & Seeding for branches, warehouses, and inventory
  useEffect(() => {
    if (!business?.id || !business?.source) {
      setBranches([]);
      setWarehouses([]);
      setInventory([]);
      setBranchesLoading(false);
      setWarehousesLoading(false);
      setInventoryLoading(false);
      return;
    }

    setBranchesLoading(true);
    setWarehousesLoading(true);
    setInventoryLoading(true);

    const branchesColl = collection(db, `${business.source}/${business.id}/branches`);
    const warehousesColl = collection(db, `${business.source}/${business.id}/warehouses`);
    const inventoryColl = collection(db, `${business.source}/${business.id}/inventory`);

    // Listen to Branches
    const unsubBranches = onSnapshot(branchesColl, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Seed default branches if empty
      if (list.length === 0) {
        try {
          const defaults = [
            { name: "Riyadh Head Office & Showroom", address: "Olaya District, Riyadh" },
            { name: "Jeddah Retail Store", address: "Tahlia Street, Jeddah" },
            { name: "Dammam Logistics Branch", address: "King Fahd Road, Dammam" }
          ];
          for (const d of defaults) {
            await addDoc(branchesColl, { ...d, createdAt: serverTimestamp() });
          }
        } catch (e) {
          console.error("Error seeding default branches:", e);
        }
      } else {
        setBranches(list);
        setBranchesLoading(false);
        // Default active branch if invalid
        if (activeBranchId !== "all" && !list.some(b => b.id === activeBranchId)) {
          setActiveBranchId("all");
        }
      }
    });

    // Listen to Warehouses
    const unsubWarehouses = onSnapshot(warehousesColl, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Seed default warehouses if empty
      if (list.length === 0) {
        try {
          const defaults = [
            { name: "Riyadh Central Warehouse", address: "Sulay District, Riyadh" },
            { name: "Jeddah Port Warehouse", address: "Port Area, Jeddah" }
          ];
          for (const d of defaults) {
            await addDoc(warehousesColl, { ...d, createdAt: serverTimestamp() });
          }
        } catch (e) {
          console.error("Error seeding default warehouses:", e);
        }
      } else {
        setWarehouses(list);
        setWarehousesLoading(false);
        // Default active warehouse if invalid
        if (activeWarehouseId !== "all" && !list.some(w => w.id === activeWarehouseId)) {
          setActiveWarehouseId("all");
        }
      }
    });

    // Listen to Inventory
    const unsubInventory = onSnapshot(inventoryColl, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInventory(list);
      setInventoryLoading(false);
    });

    return () => {
      unsubBranches();
      unsubWarehouses();
      unsubInventory();
    };
  }, [business?.id, business?.source]);

  useEffect(() => {
    if (!business?.id || !business?.source) {
      setActivePeriod(null);
      setPeriodLoading(false);
      return;
    }

    setPeriodLoading(true);
    creatingPeriodRef.current = false;

    const periodsCollection = collection(db, `${business.source}/${business.id}/periods`);
    const activePeriodQuery = query(
      periodsCollection,
      where("status", "==", "active")
    );

    const unsubPeriod = onSnapshot(
      activePeriodQuery,
      async (snap) => {
        if (!snap.empty) {
          const sortedDocs = [...snap.docs].sort((a, b) => {
            const aTime = a.data().createdAt?.toMillis?.() || a.data().createdAt?.seconds * 1000 || 0;
            const bTime = b.data().createdAt?.toMillis?.() || b.data().createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });
          const periodDoc = sortedDocs[0];
          setActivePeriod({ id: periodDoc.id, ...periodDoc.data() });
          setPeriodLoading(false);
          return;
        }

        if (!creatingPeriodRef.current) {
          creatingPeriodRef.current = true;
          try {
            await addDoc(periodsCollection, {
              startDate: new Date(),
              status: "active",
              createdAt: serverTimestamp(),
            });
          } catch (err) {
            console.error("Error creating initial period:", err);
            setPeriodLoading(false);
          }
        }
      },
      (err) => {
        console.error("Error subscribing to active period:", err);
        setPeriodLoading(false);
      }
    );

    return () => unsubPeriod();
  }, [business?.id, business?.source]);

  // Expose inventory write functions
  const addBranch = async (name, address) => {
    if (!business) return;
    const branchesColl = collection(db, `${business.source}/${business.id}/branches`);
    await addDoc(branchesColl, { name, address, createdAt: serverTimestamp() });
  };

  const addWarehouse = async (name, address) => {
    if (!business) return;
    const warehousesColl = collection(db, `${business.source}/${business.id}/warehouses`);
    await addDoc(warehousesColl, { name, address, createdAt: serverTimestamp() });
  };

  const updateInventoryStock = async ({
    productId,
    variantId = "base",
    branchId,
    warehouseId = "",
    currentQuantity,
    reservedQuantity = 0,
    minimumStock = 0,
    maximumStock = 1000,
  }) => {
    if (!business) return;
    const invId = `${productId}_${variantId || "base"}_${branchId}`;
    const invDocRef = doc(db, `${business.source}/${business.id}/inventory`, invId);
    
    await setDoc(invDocRef, {
      productId,
      variantId: variantId || "base",
      branchId,
      warehouseId: warehouseId || "",
      currentQuantity: parseInt(currentQuantity, 10),
      reservedQuantity: parseInt(reservedQuantity, 10),
      minimumStock: parseInt(minimumStock, 10),
      maximumStock: parseInt(maximumStock, 10),
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        setBusiness,
        loading,
        activePeriod,
        periodLoading,
        branches,
        warehouses,
        inventory,
        branchesLoading,
        warehousesLoading,
        inventoryLoading,
        activeBranchId,
        setActiveBranchId,
        activeWarehouseId,
        setActiveWarehouseId,
        displayMode,
        setDisplayMode,
        addBranch,
        addWarehouse,
        updateInventoryStock,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}
