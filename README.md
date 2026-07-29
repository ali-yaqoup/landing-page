<div align="center">

# ⚡ ستوك فلو — StockFlow

**نظام عربي متكامل لإدارة المخزون ونقطة البيع والتقارير الذكية**

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=0b1220" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&labelColor=0b1220" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&labelColor=0b1220" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=white&labelColor=0b1220" alt="Firebase 12" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white&labelColor=0b1220" alt="Express 5" />
  <img src="https://img.shields.io/badge/%D8%B9%D8%B1%D8%A8%D9%8A-RTL-10b981?labelColor=0b1220" alt="Arabic RTL" />
</p>

</div>

---

<div dir="rtl">

## 🧭 نظرة عامة

**ستوك فلو** منصّة ويب لإدارة الأنشطة التجارية الصغيرة والمتوسطة — من تتبّع المخزون لحظيًا، إلى تسجيل المبيعات (POS)، والمصاريف، والعملاء والموردين، وصولًا لتقارير أرباح واضحة تساعدك تاخد قرارك بثقة.

مبنيّة **بالعربي أولًا** (RTL كامل مع دعم الإنجليزية)، بثيم داكن أنيق بهوية `slate + cyan`، وأنيميشن تفاعلي يخلّي التجربة حيّة.

## ✨ المزايا

| | الميزة | الوصف |
|---|--------|-------|
| 📊 | **لوحة التحكم** | مؤشرات أداء فورية: المبيعات، الأرباح، هامش الربح، وتنبيهات المخزون |
| 📦 | **المنتجات والتصنيفات** | كتالوج كامل مع صور، أسعار وتكاليف، وسجل حركات المخزون (StockHistory) |
| 🛒 | **المبيعات (POS)** | تسجيل عمليات بيع سريع مع خصم تلقائي من المخزون |
| 💸 | **المصاريف** | تسجيل وتصنيف المصاريف التشغيلية |
| 👥 | **العملاء والموردون** | إدارة علاقات وأرصدة وتعاملات |
| 📈 | **التقارير** | تحليلات وأداء تاريخي للنشاط |
| 🏬 | **فروع ومستودعات** | التبديل بين الفروع والمستودعات من الشريط العلوي |
| 🖼️ | **صور سحابية** | رفع صور المنتجات عبر Cloudinary مع تحسين تلقائي للجودة والحجم |
| 🌍 | **عربي / إنجليزي** | i18n كامل مع اتجاه RTL/LTR ديناميكي — العربية هي الافتراضية |
| 🌗 | **ثيم داكن / فاتح** | الثيم الداكن هو الهوية الافتراضية، مع إمكانية التبديل |
| 🎬 | **أنيميشن تفاعلي** | محاكي POS حي في صفحة الهبوط: إمالة ثلاثية الأبعاد، أرقام تعدّ، وإشعارات حية (framer-motion) |
| 🔐 | **مصادقة آمنة** | Firebase Authentication مع مسارات محمية (Protected Routes) |

## 🛠️ التقنيات

| الطبقة | التقنية |
|--------|---------|
| واجهة المستخدم | React 19 + Vite 8 |
| التنسيق | Tailwind CSS v4 (نظام تصميم مركزي بتوكنز `sys-*`) |
| الحركة | framer-motion 12 |
| الأيقونات | lucide-react |
| التوجيه | react-router-dom 7 |
| قاعدة البيانات والمصادقة | Firebase (Firestore + Auth) |
| الخادم | Express 5 (رفع/حذف صور Cloudinary + تقديم التطبيق) |
| الخطوط | Cairo (عناوين) + Tajawal (نصوص) |
| الفحص | oxlint |

## 🚀 التشغيل السريع

</div>

```bash
# 1) استنساخ المشروع
git clone https://github.com/ali-yaqoup/Landingpage-.git
cd Landingpage-

# 2) تثبيت الاعتماديات
npm install

# 3) إعداد متغيرات البيئة
cp .env.example .env
# ثم عبِّئ القيم في ملف .env (انظر الجدول أدناه)

# 4) تشغيل بيئة التطوير (Express + Vite على المنفذ 3000)
npm run dev
```

<div dir="rtl">

## 🔑 متغيرات البيئة

انسخ `.env.example` إلى `.env` وعبِّئ القيم التالية:

| المتغير | الجهة | الوصف |
|---------|-------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase | مفتاح API لتطبيق الويب |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase | نطاق المصادقة |
| `VITE_FIREBASE_PROJECT_ID` | Firebase | معرّف المشروع |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase | حاوية التخزين |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase | معرّف المُرسل |
| `VITE_FIREBASE_APP_ID` | Firebase | معرّف التطبيق |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | اسم السحابة (للخادم) |
| `CLOUDINARY_API_KEY` | Cloudinary | مفتاح API (للخادم) |
| `CLOUDINARY_API_SECRET` | Cloudinary | السر — **لا تشاركه أبدًا** |

> ⚠️ متغيرات `VITE_*` تُضمَّن في كود العميل، بينما متغيرات Cloudinary تبقى على الخادم فقط (`server.js`).

## 📜 الأوامر المتاحة

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تشغيل بيئة التطوير (Express + Vite middleware على المنفذ 3000) |
| `npm run build` | بناء نسخة الإنتاج في مجلد `dist` |
| `npm run preview` | معاينة نسخة الإنتاج |
| `npm run lint` | فحص الكود بـ oxlint |
| `npm start` | تشغيل خادم الإنتاج (يقدّم `dist`) |

## 🗂️ بنية المشروع

</div>

```
├── server.js                  # خادم Express: رفع/حذف صور Cloudinary + تقديم التطبيق
├── docs/
│   └── ARCHITECTURE_BIBLE.md  # المواصفة المعمارية الكاملة للمنصة
└── src/
    ├── components/
    │   ├── animations/        # TiltCard، CountUp، LiveToasts، Transition
    │   ├── icons/             # أيقونات مخصّصة
    │   ├── layout/            # Sidebar، Navbar، Footer، MainLayout، ProtectedRoute
    │   └── ui/                # Card، Modal، Table، EmptyState، ...
    ├── constants/             # ثوابت التطبيق
    ├── context/               # Auth، Business، Theme، Language
    ├── hooks/                 # هوكس مخصّصة (useBusiness، ...)
    ├── lib/                   # تهيئة Firebase
    ├── locales/               # ar.json + en.json (الترجمات)
    ├── pages/                 # 13 صفحة: Dashboard، Products، Sales، Reports، ...
    ├── styles/                # نظام التصميم المركزي (index.css — توكنز sys-*)
    └── utils/                 # دوال مساعدة نقيّة
```

<div dir="rtl">

## 🏗️ لمحة معمارية

- **عزل البيانات متعدد المستأجرين**: بيانات كل نشاط تجاري معزولة في Firestore تحت مسار `‎/businesses/{businessId}/...‎` (منتجات، مبيعات، مصاريف، عملاء، موردون) — فلا يمكن لأي استعلام الوصول لبيانات نشاط آخر.
- **نظام تصميم مركزي**: كل الألوان والخطوط والمسافات توكنز CSS في `src/styles/index.css`، فأي تعديل عليها ينعكس على كل الصفحات تلقائيًا.
- **اللغة والاتجاه**: `LanguageContext` يضبط `dir` و`lang` على مستوى المستند ديناميكيًا، مع ترجمات متداخلة وfallback ذكي للإنجليزية.

📖 التفاصيل الكاملة في [`docs/ARCHITECTURE_BIBLE.md`](docs/ARCHITECTURE_BIBLE.md).

## 👨‍💻 المطوّر

**علي يعقوب** — مطوّر Full Stack متخصّص في React وواجهات المستخدم

<a href="https://github.com/ali-yaqoup">GitHub</a> • <a href="https://linktr.ee/ali_yaqoup_dev">Linktree</a>

---

<p align="center">صُنع بشغف في فلسطين 🇵🇸</p>

</div>
