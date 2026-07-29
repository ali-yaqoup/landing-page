import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "../components/animations/TiltCard";
import LiveToasts from "../components/animations/LiveToasts";
import CountUp from "../components/animations/CountUp";
import {
  Zap,
  Package,
  TrendingUp,
  Receipt,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle,
  Star,
  Sparkles,
  BarChart3,
  Shield,
  Users,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  Languages
} from "lucide-react";

// Clean, high-fidelity translation dictionary for the Landing Page
const lpTranslations = {
  en: {
    nav: {
      features: "Features",
      demo: "Product Demo",
      reviews: "Reviews",
      faq: "FAQ",
      dashboard: "Go to Dashboard",
      signIn: "Sign In",
      startFree: "Start Free",
      getStarted: "Get Started"
    },
    hero: {
      badge: "The Modern Cloud Ledger for SMBs",
      title1: "Smart inventory.",
      title2: "Sleek retail sales.",
      title3: "Audited margins.",
      desc: "StockFlow is an all-in-one inventory, Point of Sale, and finance management platform. Stop guessing your profitability — log sales, audit vendor costs (COGS), track operating expenses, and lock monthly accounting cycles. Built for retail stores, warehouses, restaurants, and small businesses.",
      accessDashboard: "Access Dashboard",
      startTrial: "Start Free Trial",
      demoBtn: "Interactive Demo",
      metricUptime: "Uptime SLA",
      metricLogs: "Zero Double Logs",
      metricSync: "Live Cloud Sync",
    },
    demo: {
      title: "LIVE POS SIMULATOR",
      online: "ONLINE",
      sales: "Simulated Sales",
      profit: "Operating Profit",
      margin: "Profit Margin",
      clickSale: "1. Click to Record a Sale",
      stock: "Stock",
      latestLog: "2. Latest Ledger Log",
      reset: "RESET DEMO",
      justNow: "Just now",
      unit: "Unit",
      prof: "Profit",
    },
    logos: {
      title: "Trusted by businesses worldwide",
    },
    features: {
      badge: "Core Features",
      title: "Practical bookkeeping, zero complications",
      desc: "We cut out unnecessary complex charts, neon coordinates, and cyber-hacking visuals. StockFlow gives you the clean financial metrics, ledger sync, and stock alerts you need to grow your bottom line.",
      f1Title: "Real-Time Inventory",
      f1Desc: "Log products with purchasing costs and selling prices. Establish automatic alarms that warn you immediately before an item drops out of stock.",
      f2Title: "Point of Sale (POS)",
      f2Desc: "Checkout items in seconds. The sales registry instantly calculates profit per item and automatically updates your master stock counts.",
      f3Title: "Operating Expenditures",
      f3Desc: "Rent, ads, logistics, utilities. Record daily overhead and marketing spend to see your actual net bottom-line profit, not just top-line revenue.",
      f4Title: "Accounting Periods",
      f4Desc: "Freeze closed cycles monthly or quarterly. Prevent backdated transaction edits, preserve exact cash flow reports, and reset your registry clean.",
      f5Title: "Live Multi-User",
      f5Desc: "Collaborate with shop partners or floor managers in real-time. Concurrent updates sync instantly across registers, tablets, and phones.",
      f6Title: "Secure Cloud",
      f6Desc: "Your records are protected by Google Cloud Firestore and secure authorization layers. Keep working offline — local edits auto-reconcile on-network.",
    },
    showcase: {
      badge: "The User Experience",
      title: "Engineered to match the clean dashboard",
      desc: "StockFlow's marketing and management tools belong to the same unified ecosystem. We've optimized the layout for high-density, readable operations on desktop screens, floor registers, and mobile phones alike.",
      c1Title: "High Contrast Design",
      c1Desc: "High legibility for store owners checking stock quickly during busy periods.",
      c2Title: "Flexible Accounting Closed State",
      c2Desc: "Separate accounting cycles to lock past financial periods cleanly and secure your taxes.",
      cta: "Access Your Digital Register Now",
      subTitle: "Real Dashboard View",
      subBadge: "Interactive Widget",
      revenue: "Gross Monthly Revenue",
      activeCycle: "Active Accounting Cycle:",
    },
    testimonials: {
      badge: "Testimonials",
      title: "Loved by local store owners and operators",
      desc: "Real business owners depend on StockFlow to preserve ledger accuracy, prevent inventory leakage, and review real operational profit.",
      items: [
        {
          quote: '"Before StockFlow, tracking monthly COGS was a nightmare of spreadsheet calculations. Now, we record cash register sales directly in the POS, and our net profit is updated on-the-fly. Highly recommend for any retail storefront."',
          name: "Marcus Vance",
          role: "Owner, Vance Retail Store",
          initials: "MK"
        },
        {
          quote: '"The offline cache mode has saved us countless times in our deep steel warehouse where Wi-Fi signal drops constantly. Staff adjust product quantities and logging continues offline. Once connected, everything resolves instantly."',
          name: "Sarah Jenkins",
          role: "Warehouse Manager, Apex Logistics",
          initials: "SH"
        },
        {
          quote: '"We love locking our accounting periods at the end of each month. It prevents staff from accidentally overriding last week\'s logged expenses, keeping our tax records completely pristine and locked. A brilliant design."',
          name: "Daniel Ruiz",
          role: "General Manager, Cosmos Bistro",
          initials: "DR"
        }
      ]
    },
    faq: {
      badge: "FAQ",
      title: "Frequently Asked Inquiries",
      items: [
        {
          q: "How does StockFlow compute real-time inventory and margins?",
          a: "Every transaction recorded in your Point of Sale registry automatically decrements current stock levels. It instantly references the purchase Cost of Goods Sold (COGS) to calculate your exact gross profit margin on every invoice."
        },
        {
          q: "Is my business database secure in the cloud?",
          a: "Yes, fully. StockFlow utilizes Google Firebase with hardened Firestore Security Rules. This ensures that only authenticated members of your store can view, edit, or export your sales and operational records. Your financial ledger remains private."
        },
        {
          q: "What are 'Accounting Periods' and how do they work?",
          a: "Accounting periods (e.g., monthly or quarterly cycles) allow you to seal your books. Closing a period locks its sales, costs, and expenses from accidental edits, storing a static report of your business performance, and opening a fresh period."
        },
        {
          q: "Does StockFlow support offline record keeping?",
          a: "Absolutely. Backed by offline-first firestore capabilities, you can keep scanning items and logging sales on the warehouse or retail floor without cellular data. When you reconnect, your local logs sync seamlessly with the cloud."
        },
        {
          q: "Can I manage multiple user permissions or registers?",
          a: "Yes. Our cloud synchronization pushes live updates across multiple active registers or warehouse tablets, allowing team members to perform stock check-ins, sales, and expense logs concurrently without conflict."
        }
      ]
    },
    ctaBanner: {
      badge: "Get Started Instantly",
      title: "Claim Your Digital Store Register Today",
      desc: "Establish your store's cloud ledger in less than 30 seconds. Protect your gross margins, audit operating overhead, and seal your accounting periods cleanly.",
      btnWorkspace: "Access Workspace",
      btnStart: "Get Started Now",
    },
    footer: {
      desc: "Streamlined real-time stock accounting, margin analysis, and secure operational ledger records built for retail businesses, restaurants, and wholesale warehouses.",
      index: "INDEX",
      capabilities: "Capabilities",
      pos: "Interactive POS",
      reviews: "Customer Reviews",
      status: "RUNTIME PLATFORM STATUS",
      dbEngine: "DATABASE ENGINE:",
      auth: "AUTHENTICATION:",
      authVal: "FIREBASE SECURITY",
      persistence: "DATA PERSISTENCE:",
      persistenceVal: "ENFORCED",
      copyright: "STOCKFLOW LEDGER SYSTEM. ALL RIGHTS RESERVED.",
      powered: "POWERED BY FIREBASE SECURED AUTHENTICATED WORKSPACES",
    }
  },
  ar: {
    nav: {
      features: "المميزات",
      demo: "عرض المنتج",
      reviews: "الآراء",
      faq: "الأسئلة الشائعة",
      dashboard: "لوحة التحكم",
      signIn: "تسجيل الدخول",
      startFree: "ابدأ مجاناً",
      getStarted: "ابدأ الآن"
    },
    hero: {
      badge: "دفتر الحسابات السحابي الحديث للمنشآت الصغيرة والمتوسطة",
      title1: "مخزون ذكي.",
      title2: "مبيعات تجزئة سلسة.",
      title3: "هوامش ربح مدققة.",
      desc: "ستوك فلو هي منصة متكاملة لإدارة المخزون ونقاط البيع والمالية. توقف عن التخمين بشأن أرباحك - سجل المبيعات، ودقق تكاليف الموردين (COGS)، وتتبع نفقات التشغيل، وأغلق الدورات المحاسبية الشهرية. مصممة لمحلات التجزئة والمستودعات والمطاعم والشركات الصغيرة.",
      accessDashboard: "دخول لوحة التحكم",
      startTrial: "ابدأ الفترة التجريبية مجاناً",
      demoBtn: "عرض تجريبي تفاعلي",
      metricUptime: "اتفاقية جاهزية الخدمة 99.9%",
      metricLogs: "خالٍ من التكرار",
      metricSync: "مزامنة سحابية حية",
    },
    demo: {
      title: "محاكي نقطة البيع المباشر",
      online: "متصل بالشبكة",
      sales: "المبيعات المحاكاة",
      profit: "الربح التشغيلي",
      margin: "هامش الربح",
      clickSale: "1. اضغط لتسجيل عملية بيع",
      stock: "المخزون",
      latestLog: "2. أحدث سجل في الدفتر",
      reset: "إعادة تعيين المحاكي",
      justNow: "الآن",
      unit: "وحدة",
      prof: "الربح",
    },
    logos: {
      title: "موثوق من قبل الشركات حول العالم",
    },
    features: {
      badge: "المميزات الرئيسية",
      title: "دفتر حسابات عملي، بدون أي تعقيدات",
      desc: "لقد تخلصنا من الرسوم البيانية المعقدة غير الضرورية والتفاصيل البصرية المشتتة. يمنحك ستوك فلو مقاييس مالية واضحة ومزامنة للدفاتر وتنبيهات للمخزون تحتاجها لزيادة أرباحك.",
      f1Title: "إدارة المخزون المباشرة",
      f1Desc: "سجل المنتجات مع تكاليف الشراء وأسعار البيع. ضع تنبيهات تلقائية تحذرك فوراً قبل نفاد أي منتج من المخزون.",
      f2Title: "نقطة البيع (POS)",
      f2Desc: "أكمل عمليات البيع في ثوانٍ. يحسب سجل المبيعات على الفور الأرباح لكل منتج ويقوم بتحديث كميات المخزون الرئيسية تلقائياً.",
      f3Title: "النفقات التشغيلية",
      f3Desc: "الإيجار، الإعلانات، الخدمات اللوجستية، والمرافق. سجل المصاريف اليومية والنفقات التسويقية لتري أرباحك الصافية الحقيقية، وليس فقط إجمالي الإيرادات.",
      f4Title: "الفترات المحاسبية",
      f4Desc: "قم بتجميد الدورات المغلقة شهرياً أو ربع سنوياً. امنع التعديلات ذات الأثر الرجعي على المعاملات، وحافظ على تقارير التدفق النقدي الدقيقة، وابدأ دورتك الجديدة بنظافة.",
      f5Title: "مشاركة حية لعدة مستخدمين",
      f5Desc: "تعاون مع شركاء العمل أو مديري الفروع في الوقت الفعلي. تتزامن التحديثات المتزامنة فورياً عبر أجهزة تسجيل النقد والأجهزة اللوحية والهواتف.",
      f6Title: "سحابة آمنة وموثوقة",
      f6Desc: "سجلاتك محمية بواسطة Google Cloud Firestore وطبقات حماية آمنة. واصل العمل دون اتصال بالإنترنت - وستتم مزامنة التعديلات المحلية تلقائياً عند الاتصال.",
    },
    showcase: {
      badge: "تجربة المستخدم",
      title: "مصممة لتطابق لوحة التحكم البسيطة والنظيفة",
      desc: "تنتمي أدوات التسويق والإدارة في ستوك فلو إلى نفس النظام الموحد والمترابط. لقد قمنا بتحسين التصميم ليكون عملياً عالي الكثافة وسهل القراءة على شاشات الكمبيوتر وأجهزة تسجيل النقد والهواتف المحمولة على حد سواء.",
      c1Title: "تصميم عالي التباين",
      c1Desc: "وضوح قراءة ممتاز لأصحاب المتاجر للتحقق من المخزون بسرعة خلال فترات العمل المزدحمة.",
      c2Title: "حالة إغلاق محاسبية مرنة",
      c2Desc: "دورات محاسبية منفصلة لقفل الفترات المالية السابقة بشكل كامل وحماية سجلاتك الضريبية.",
      cta: "ادخل إلى سجلك الرقمي الآن",
      subTitle: "عرض لوحة التحكم الحقيقية",
      subBadge: "أداة تفاعلية حية",
      revenue: "إجمالي الإيرادات الشهرية",
      activeCycle: "الدورة المحاسبية النشطة:",
    },
    testimonials: {
      badge: "آراء العملاء",
      title: "محبوب من قبل أصحاب المتاجر والمشغلين المحليين",
      desc: "يعتمد أصحاب الأعمال الحقيقيون على ستوك فلو للحفاظ على دقة دفاتر الحسابات، ومنع تسرب المخزون، ومراجعة الأرباح التشغيلية الحقيقية.",
      items: [
        {
          quote: '"قبل ستوك فلو، كان تتبع تكلفة البضائع المباعة (COGS) كابوساً من حسابات جداول البيانات المعقدة. الآن، نسجل المبيعات مباشرة في نقطة البيع، ويتم تحديث صافي أرباحنا بشكل فوري. نوصي به بشدة لأي متجر تجزئة."',
          name: "ماركوس فانس",
          role: "مالك، متجر فانس للتجزئة",
          initials: "ماركوس"
        },
        {
          quote: '"أنقذنا وضع العمل دون اتصال بالإنترنت مرات لا تحصى في مستودعاتنا الفولاذية العميقة حيث تنقطع إشارة الواي فاي باستمرار. يقوم الموظفون بتعديل كميات المنتجات ويستمر تسجيل البيانات دون اتصال، وبمجرد عودة الاتصال يتزامن كل شيء فوراً."',
          name: "سارة جينكينز",
          role: "مدير المستودع، أيبكس للخدمات اللوجستية",
          initials: "سارة"
        },
        {
          quote: '"نحن نحب إغلاق فتراتنا المحاسبية في نهاية كل شهر. يمنع هذا الموظفين من تعديل نفقات الأسبوع الماضي عن طريق الخطأ، مما يحافظ على نظافة وسرية سجلاتنا الضريبية. تصميم رائع ومبتكر."',
          name: "دانيال رويز",
          role: "المدير العام، كوزموس بيسترو",
          initials: "دانيال"
        }
      ]
    },
    faq: {
      badge: "الأسئلة الشائعة",
      title: "الأسئلة الأكثر شيوعاً والردود عليها",
      items: [
        {
          q: "كيف يقوم ستوك فلو بحساب المخزون وهوامش الربح في الوقت الفعلي؟",
          a: "كل معاملة يتم تسجيلها في سجل نقطة البيع تقوم تلقائياً بخصم مستويات المخزون الحالية. تشير المنصة على الفور إلى تكلفة شراء البضائع المباعة (COGS) لحساب هامش الربح الإجمالي الدقيق لكل فاتورة."
        },
        {
          q: "هل قاعدة بيانات عملي آمنة في السحابة؟",
          a: "نعم، تماماً. يستخدم ستوك فلو نظام Google Firebase مع قواعد أمان Firestore المحصنة. يضمن هذا أن الأعضاء المعتمدين والمصرح لهم فقط في متجرك يمكنهم عرض أو تعديل أو تصدير سجلات المبيعات والعمليات الخاصة بك. دفتر حساباتك المالي يظل خاصاً وسرياً."
        },
        {
          q: "ما هي 'الفترات المحاسبية' وكيف تعمل؟",
          a: "تتيح لك الفترات المحاسبية (مثل الدورات الشهرية أو الربع سنوية) ختم دفاتر حساباتك. يؤدي إغلاق الفترة إلى قفل مبيعاتها وتكاليفها ومصروفاتها من التعديلات غير المقصودة، وتخزين تقرير ثابت لأداء عملك، وفتح فترة جديدة ونظيفة."
        },
        {
          q: "هل يدعم ستوك فلو تسجيل السجلات دون اتصال بالإنترنت؟",
          a: "بكل تأكيد. بفضل إمكانيات Firestore المصممة للعمل دون اتصال أولاً، يمكنك الاستمرار في مسح السلع ضوئياً وتسجيل المبيعات في المستودع أو صالة البيع دون الحصول على بيانات خلوية. عند إعادة الاتصال بالشبكة، تتزامن سجلاتك المحلية بسلاسة مع السحابة."
        },
        {
          q: "هل يمكنني إدارة صلاحيات مستخدمين متعددين أو صناديق تسجيل نقدية متعددة؟",
          a: "نعم. تدفع المزامنة السحابية لدينا التحديثات المباشرة عبر العديد من صناديق تسجيل النقد النشطة أو الأجهزة اللوحية في المستودعات، مما يسمح لأعضاء الفريق بإجراء عمليات فحص المخزون والمبيعات وسجلات النفقات بالتزامن ودون أي تضارب."
        }
      ]
    },
    ctaBanner: {
      badge: "ابدأ فوراً وبسهولة",
      title: "احصل على سجل متجرك الرقمي اليوم",
      desc: "أنشئ دفتر متجرك السحابي في أقل من 30 ثانية. احمِ هوامش ربحك الإجمالية، ودقق المصاريف التشغيلية، وأغلق فتراتك المحاسبية بنظافة وسهولة.",
      btnWorkspace: "دخول مساحة العمل",
      btnStart: "ابدأ الآن مجاناً",
    },
    footer: {
      desc: "تنظيم مبسط لحسابات المخزون في الوقت الفعلي، وتحليل هوامش الأرباح، وسجلات دفاتر العمليات الآمنة المصممة لمتاجر التجزئة والمطاعم ومستودعات الجملة.",
      index: "الفهرس",
      capabilities: "القدرات والإمكانيات",
      pos: "نقطة بيع تفاعلية",
      reviews: "آراء العملاء",
      status: "حالة منصة التشغيل",
      dbEngine: "محرك قاعدة البيانات:",
      auth: "نظام التحقق من الهوية:",
      authVal: "حماية وأمن فايربيس",
      persistence: "حفظ واستمرارية البيانات:",
      persistenceVal: "مفعل ومطبق",
      copyright: "نظام ستوك فلو للمحاسبة والمخزون. جميع الحقوق محفوظة.",
      powered: "مشغل بواسطة مساحات عمل آمنة وموثقة من فايربيس",
    }
  }
};

export default function LandingPage() {
  const { user } = useContext(AuthContext);
  const { dark, toggle } = useTheme();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active FAQ index tracking
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Active language dictionary
  const tLP = lpTranslations[language] || lpTranslations['en'];

  // Interactive Live Product Showcase state
  const [demoStock, setDemoStock] = useState({
    headset: { name: "Pro Wireless Headset", qty: 24, cost: 35.0, price: 79.99, margin: 56.2 },
    chair: { name: "Ergonomic Office Chair", qty: 8, cost: 85.0, price: 189.99, margin: 55.3 },
    keyboard: { name: "Mechanical RGB Keyboard", qty: 3, cost: 40.0, price: 95.0, margin: 57.9 }
  });
  const [demoSales, setDemoSales] = useState([
    { id: 1, name: "headset", qty: 1, total: 79.99, profit: 44.99, time: "justNow" }
  ]);

  const getDemoProductName = (key) => {
    if (language === 'ar') {
      if (key === 'headset') return "سماعة لاسلكية احترافية";
      if (key === 'chair') return "كرسي مكتب مريح";
      if (key === 'keyboard') return "لوحة مفاتيح ميكانيكية مضيئة";
    }
    return demoStock[key]?.name || key;
  };

  const recordDemoSale = (key) => {
    const product = demoStock[key];
    if (product.qty <= 0) return;

    // Decrement stock
    setDemoStock(prev => ({
      ...prev,
      [key]: { ...prev[key], qty: prev[key].qty - 1 }
    }));

    // Log sale
    const profit = product.price - product.cost;
    setDemoSales(prev => [
      {
        id: Date.now(),
        name: key,
        qty: 1,
        total: product.price,
        profit: parseFloat(profit.toFixed(2)),
        time: "justNow"
      },
      ...prev.slice(0, 2)
    ]);
  };

  const resetDemo = () => {
    setDemoStock({
      headset: { name: "Pro Wireless Headset", qty: 24, cost: 35.0, price: 79.99, margin: 56.2 },
      chair: { name: "Ergonomic Office Chair", qty: 8, cost: 85.0, price: 189.99, margin: 55.3 },
      keyboard: { name: "Mechanical RGB Keyboard", qty: 3, cost: 40.0, price: 95.0, margin: 57.9 }
    });
    setDemoSales([
      { id: 1, name: "headset", qty: 1, total: 79.99, profit: 44.99, time: "justNow" }
    ]);
  };

  const demoTotalSales = demoSales.reduce((sum, s) => sum + s.total, 1420.50);
  const demoTotalProfit = demoSales.reduce((sum, s) => sum + s.profit, 780.20);
  const averageMargin = 56.1;

  // Floating live-activity notifications around the hero mockup
  const liveToasts = language === "ar"
    ? [
        { type: "sale", title: "عملية بيع جديدة 🎉", sub: "سماعة لاسلكية × 1 — +$79.99" },
        { type: "profit", title: "الأرباح بارتفاع", sub: "+8.2% عن الأمس" },
        { type: "stock", title: "تنبيه مخزون", sub: "لوحة مفاتيح ميكانيكية — باقي 3" },
        { type: "customer", title: "عميل جديد انضم", sub: "متجر النور — رام الله" },
      ]
    : [
        { type: "sale", title: "New sale recorded 🎉", sub: "Wireless Headset × 1 — +$79.99" },
        { type: "profit", title: "Profit trending up", sub: "+8.2% vs yesterday" },
        { type: "stock", title: "Low stock alert", sub: "Mechanical Keyboard — 3 left" },
        { type: "customer", title: "New customer joined", sub: "Al-Noor Store — Ramallah" },
      ];

  const handleCTA = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const formattedMoney = (amount) => {
    return language === 'ar' 
      ? `${amount.toFixed(2)} $`
      : `$${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-900 dark:selection:text-cyan-200 transition-colors duration-300 relative overflow-x-hidden">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9.5 h-9.5 bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Zap size={18} className="text-white fill-current" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-start">
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                {language === 'ar' ? (
                  <span>ستوك<span className="text-cyan-600 dark:text-cyan-400">فلو</span></span>
                ) : (
                  <span>Stock<span className="text-cyan-600 dark:text-cyan-400">Flow</span></span>
                )}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wide mt-1">
                {language === 'ar' ? "دفتر مبيعات ونقاط بيع ذكي" : "Smart Ledger POS"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              {tLP.nav.features}
            </a>
            <a href="#showcase" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              {tLP.nav.demo}
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              {tLP.nav.reviews}
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              {tLP.nav.faq}
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5 cursor-pointer"
              title={language === 'en' ? "تحويل إلى العربية" : "Switch to English"}
            >
              <Languages size={14} />
              <span>{language === 'en' ? "العربية" : "English"}</span>
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200/50 dark:border-slate-800/50 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-4.5 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
              >
                {tLP.nav.dashboard}
                <ArrowRight size={14} className={language === 'ar' ? "mr-1.5 rotate-180" : "ml-1.5"} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-3 py-2 transition-colors"
                >
                  {tLP.nav.signIn}
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4.5 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                >
                  {tLP.nav.startFree}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle & Lang */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-2.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200/50 dark:border-slate-800/50 text-xs font-bold flex items-center gap-1"
            >
              <Languages size={13} />
              <span>{language === 'en' ? "عربي" : "EN"}</span>
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200/50 dark:border-slate-800/50"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200/50 dark:border-slate-800/50"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-6 space-y-4 text-start"
          >
            <div className="flex flex-col space-y-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 block"
              >
                {tLP.nav.features}
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 block"
              >
                {tLP.nav.demo}
              </a>
              <a
                href="#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 block"
              >
                {tLP.nav.reviews}
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 block"
              >
                {tLP.nav.faq}
              </a>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold bg-cyan-600 text-white shadow-sm"
                >
                  {tLP.nav.dashboard}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {tLP.nav.signIn}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-cyan-600 text-white shadow-sm"
                  >
                    {tLP.nav.getStarted}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-cyan-50/20 via-transparent to-transparent dark:from-cyan-950/10 dark:via-transparent dark:to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Column 1: Core Copy */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/40 dark:border-cyan-800/30">
                <Sparkles size={13} className="text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span>{tLP.hero.badge}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {tLP.hero.title1} <br />
                {tLP.hero.title2} <br />
                <span className="text-cyan-600 dark:text-cyan-400">{tLP.hero.title3}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {tLP.hero.desc}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleCTA}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <span>{user ? tLP.ctaBanner.btnWorkspace : tLP.hero.startTrial}</span>
                  <ArrowRight size={16} className={language === 'ar' ? "mr-2 rotate-180" : "ml-2"} />
                </button>
                <a
                  href="#showcase"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all duration-200"
                >
                  {tLP.hero.demoBtn}
                </a>
              </div>

              {/* Quick trust metrics */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 max-w-md mx-auto lg:mx-0 text-start">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">99.9%</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{tLP.hero.metricUptime}</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? "خالٍ" : "Zero"}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{tLP.hero.metricLogs}</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? "مباشر" : "Live"}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{tLP.hero.metricSync}</div>
                </div>
              </div>

            </div>

            {/* Column 2: Sleek Interactive POS Sandbox */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-2xl blur-2xl opacity-50 dark:opacity-30 -z-10" />
              <LiveToasts items={liveToasts} />
              <TiltCard>
              <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden font-sans">
                
                {/* Header bar */}
                <div className="px-5 py-3.5 border-b border-slate-150 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-wider">{tLP.demo.title}</span>
                  <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 px-2 py-0.5 rounded font-bold font-mono uppercase">{tLP.demo.online}</span>
                </div>

                {/* Simulated Stats */}
                <div className="p-5 bg-slate-50/50 dark:bg-slate-950/30 grid grid-cols-3 gap-3 border-b border-slate-150 dark:border-slate-800/60 text-start">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">{tLP.demo.sales}</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white font-mono"><CountUp value={demoTotalSales} format={formattedMoney} /></span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">{tLP.demo.profit}</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono"><CountUp value={demoTotalProfit} format={formattedMoney} /></span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">{tLP.demo.margin}</span>
                    <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono">{averageMargin}%</span>
                  </div>
                </div>

                {/* Sandbox Click Area */}
                <div className="p-5 space-y-4 text-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">{tLP.demo.clickSale}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.keys(demoStock).map((key) => {
                        const item = demoStock[key];
                        return (
                          <motion.button
                            key={key}
                            whileHover={item.qty > 0 ? { y: -3 } : undefined}
                            whileTap={item.qty > 0 ? { scale: 0.95 } : undefined}
                            onClick={() => recordDemoSale(key)}
                            disabled={item.qty <= 0}
                            className={`p-3 rounded-xl border text-start flex flex-col justify-between transition-all group ${
                              item.qty > 0 
                                ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md cursor-pointer" 
                                : "border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              {getDemoProductName(key)}
                            </span>
                            <div className="mt-2.5 flex items-baseline justify-between w-full">
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                {tLP.demo.stock}: <b className="text-slate-700 dark:text-slate-300">{item.qty}</b>
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{formattedMoney(item.price)}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Logs list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{tLP.demo.latestLog}</h4>
                      <button onClick={resetDemo} className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer">{tLP.demo.reset}</button>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2 max-h-36 overflow-y-auto">
                      <AnimatePresence initial={false}>
                      {demoSales.map((sale) => (
                        <motion.div
                          key={sale.id}
                          layout
                          initial={{ opacity: 0, y: -12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="flex justify-between items-center text-xs border-b border-slate-200/55 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                          <div className="flex flex-col text-start">
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{getDemoProductName(sale.name)}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {tLP.demo.justNow} • 1 {tLP.demo.unit}
                            </span>
                          </div>
                          <div className="text-end">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">+{formattedMoney(sale.total)}</div>
                            <div className="text-[10px] text-emerald-500 font-mono font-medium">
                              {tLP.demo.prof}: +{formattedMoney(sale.profit)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

              </div>
              </TiltCard>
            </div>

          </div>
        </div>
      </section>

      {/* REASSURANCE LOGO STRIP */}
      <section className="py-8 bg-white dark:bg-slate-950 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">
            {tLP.logos.title}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 dark:opacity-40">
            <span className="font-display font-extrabold text-lg tracking-wider text-slate-900 dark:text-white">APEX_WAREHOUSE</span>
            <span className="font-serif italic font-bold text-lg tracking-tight text-slate-900 dark:text-white">Mercato Retail</span>
            <span className="font-sans font-bold text-base text-slate-900 dark:text-white">VERTEX LOGISTICS</span>
            <span className="font-mono text-sm tracking-widest text-slate-900 dark:text-white">CHRONO_GROUP</span>
            <span className="font-sans font-black text-lg tracking-tighter text-slate-900 dark:text-white">COSMOS BISTRO</span>
          </div>
        </div>
      </section>

      {/* CAPABILITIES & BENEFITS SECTION */}
      <section id="features" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/40 dark:border-cyan-800/30 uppercase">
              <span>{tLP.features.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tLP.features.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              {tLP.features.desc}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Box 1 */}
            <div className="p-6.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow transition-all duration-200 space-y-4 text-start">
              <div className="w-11 h-11 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Package size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tLP.features.f1Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tLP.features.f1Desc}</p>
            </div>

            {/* Box 2 */}
            <div className="p-6.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow transition-all duration-200 space-y-4 text-start">
              <div className="w-11 h-11 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tLP.features.f2Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tLP.features.f2Desc}</p>
            </div>

            {/* Box 3 */}
            <div className="p-6.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow transition-all duration-200 space-y-4 text-start">
              <div className="w-11 h-11 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tLP.features.f3Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tLP.features.f3Desc}</p>
            </div>

            {/* Box 4 */}
            <div className="p-6.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow transition-all duration-200 space-y-4 text-start">
              <div className="w-11 h-11 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Layers size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tLP.features.f4Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tLP.features.f4Desc}</p>
            </div>

            {/* Box 5 */}
            <div className="p-6.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow transition-all duration-200 space-y-4 text-start">
              <div className="w-11 h-11 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tLP.features.f5Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tLP.features.f5Desc}</p>
            </div>

            {/* Box 6 */}
            <div className="p-6.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow transition-all duration-200 space-y-4 text-start">
              <div className="w-11 h-11 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tLP.features.f6Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tLP.features.f6Desc}</p>
            </div>

          </div>
        </div>
      </section>

      {/* DYNAMIC PRODUCT SHOWCASE */}
      <section id="showcase" className="py-20 lg:py-28 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Column 1: Feature Text */}
            <div className="lg:col-span-5 space-y-6 text-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/40 dark:border-cyan-800/30 uppercase">
                <span>{tLP.showcase.badge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                {tLP.showcase.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                {tLP.showcase.desc}
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <CheckCircle size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tLP.showcase.c1Title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tLP.showcase.c1Desc}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tLP.showcase.c2Title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tLP.showcase.c2Desc}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCTA}
                  className="inline-flex items-center text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 gap-1 group cursor-pointer"
                >
                  <span>{tLP.showcase.cta}</span>
                  <ChevronRight size={15} className={`transition-transform ${language === 'ar' ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`} />
                </button>
              </div>
            </div>

            {/* Column 2: Dashboard Preview Mock */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
              
              <div className="space-y-4 relative text-start">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{tLP.showcase.subTitle}</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">{tLP.showcase.subBadge}</span>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4.5 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">{tLP.showcase.revenue}</span>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {formattedMoney(18450.25)}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                      <TrendingUp size={12} />
                      <span>+14.5%</span>
                    </span>
                  </div>

                  {/* Clean Area Chart SVG */}
                  <div className="h-28 w-full relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartCyan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2"/>
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeWidth="0.1" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                      <line x1="0" y1="15" x2="100" y2="15" stroke="currentColor" strokeWidth="0.1" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                      <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.1" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                      
                      <path d="M 0 30 L 0 25 L 20 18 L 40 24 L 60 12 L 80 15 L 100 5 L 100 30 Z" fill="url(#chartCyan)" />
                      <path
                        d="M 0 25 L 20 18 L 40 24 L 60 12 L 80 15 L 100 5"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="60" cy="12" r="2.0" fill="#06b6d4" />
                      <circle cx="100" cy="5" r="2.0" fill="#06b6d4" />
                    </svg>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-3.5 border-t border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tLP.showcase.activeCycle}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-950 dark:text-white uppercase">CYCLE_JULY_2026</span>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SOCIAL PROOF & TESTIMONIALS */}
      <section id="testimonials" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/40 dark:border-cyan-800/30 uppercase">
              <span>{tLP.testimonials.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tLP.testimonials.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              {tLP.testimonials.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tLP.testimonials.items.map((item, idx) => (
              <div key={idx} className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4.5 flex flex-col justify-between text-start">
                <div className="space-y-3.5">
                  <div className="flex text-amber-500 gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                    {item.quote}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 lg:py-28 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/40 dark:border-cyan-800/30 uppercase">
              <span>{tLP.faq.badge}</span>
            </div>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tLP.faq.title}
            </h2>
          </div>

          <div className="space-y-4 text-start">
            {tLP.faq.items.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full px-6 py-4.5 flex justify-between items-center text-start hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <HelpCircle size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span>{item.q}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 dark:text-slate-500 transition-transform duration-250 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 border-t border-slate-200/40 dark:border-slate-800/40 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed ps-10">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FINAL CTA REGISTER BANNER */}
      <section className="py-20 lg:py-24 bg-slate-50 dark:bg-slate-950/40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 md:p-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-md text-center space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 right-0 w-80 h-80 bg-cyan-500/5 dark:bg-cyan-500/3 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-xl mx-auto space-y-5 relative z-10">
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-extrabold block">{tLP.ctaBanner.badge}</span>
              <h3 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                {tLP.ctaBanner.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {tLP.ctaBanner.desc}
              </p>
              
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleCTA}
                  className="px-10 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 rounded-xl cursor-pointer"
                >
                  <span>{user ? tLP.ctaBanner.btnWorkspace : tLP.ctaBanner.btnStart}</span>
                  <ArrowRight size={16} className={language === 'ar' ? "rotate-180" : ""} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-16 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-200 dark:border-slate-900 text-start">
            
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center rounded-lg shadow-sm">
                  <Zap size={15} className="text-white fill-current" strokeWidth={2.5} />
                </div>
                <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  {language === 'ar' ? (
                    <span>ستوك<span className="text-cyan-600 dark:text-cyan-400">فلو</span></span>
                  ) : (
                    <span>Stock<span className="text-cyan-600 dark:text-cyan-400">Flow</span></span>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm">
                {tLP.footer.desc}
              </p>
            </div>

            {/* Nav Columns */}
            <div className="md:col-span-3 space-y-3">
              <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{tLP.footer.index}</h5>
              <div className="flex flex-col gap-2.5 text-xs">
                <a href="#features" className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400">{tLP.footer.capabilities}</a>
                <a href="#showcase" className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400">{tLP.footer.pos}</a>
                <a href="#testimonials" className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400">{tLP.footer.reviews}</a>
              </div>
            </div>

            <div className="md:col-span-4 space-y-3 font-mono">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{tLP.footer.status}</h5>
              <div className="p-3.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 space-y-1.5 uppercase rounded-xl text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>{tLP.footer.dbEngine}</span>
                  <span className="text-emerald-500 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span>{tLP.footer.auth}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">{tLP.footer.authVal}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tLP.footer.persistence}</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{tLP.footer.persistenceVal}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom copyright row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-slate-400 dark:text-slate-500">
            <div>
              <p>© {new Date().getFullYear()} {tLP.footer.copyright}</p>
            </div>
            <div className="flex gap-4">
              <span className="text-[9px] text-slate-400 dark:text-slate-600">{tLP.footer.powered}</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
