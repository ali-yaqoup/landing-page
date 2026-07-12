import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useBusiness } from '../hooks/useBusiness';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { business, loading: businessLoading } = useBusiness();
  const { dark, setTheme, toggle } = useTheme();
  const { t, language } = useLanguage();
  const [name, setName] = useState(business?.name || '');
  const [currency, setCurrency] = useState(business?.currency || 'SAR');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business?.name) {
      setName(business.name);
    }
    if (business?.currency) {
      setCurrency(business.currency);
    }
  }, [business]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!business) return;
    if (!name.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, business.source, business.id), {
        name: name.trim(),
        currency: currency.trim() || 'SAR',
      });
      toast.success(t('common.success'));
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') + ": " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (businessLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-[900px] mx-auto w-full flex flex-col gap-6 md:gap-8">
        <div className="empty-state">
          <p style={{ margin: 0 }}>{language === 'ar' ? "جاري تحميل الإعدادات..." : "Loading settings…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[900px] mx-auto w-full flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('nav.settings')}
        </h1>
        <p className="page-sub" style={{ margin: '0.25rem 0 0 0' }}>
          {language === 'ar'
            ? "إدارة ملف منشأتك التجاري، وتفاصيل الحساب وتفضيلات مظهر التطبيق."
            : "Manage your business profile, account details and visual preferences."}
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)', marginBottom: '1rem' }}>
            {language === 'ar' ? "ملف المنشأة" : "Business Profile"}
          </h2>
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>
                {language === 'ar' ? "اسم المنشأة" : "Business Name"}
              </label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ar' ? "أدخل اسم المنشأة" : "Enter business name"}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>
                {t('settings.business.currency')}
              </label>
              <input
                className="input"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder={t('settings.business.currencyPlaceholder')}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (language === 'ar' ? "جاري الحفظ..." : "Saving changes…") : t('common.save')}
            </button>
          </form>
        </Card>

        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)', marginBottom: '1rem' }}>
            {language === 'ar' ? "تفاصيل الحساب" : "Account Details"}
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>{language === 'ar' ? "البريد الإلكتروني" : "Email"}</span>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-1)' }}>{user?.email || 'Not available'}</span>
            </div>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>{language === 'ar' ? "المنشأة المتصلة" : "Connected Business"}</span>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-1)' }}>{business?.name || 'StockFlow'}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)', marginBottom: '1rem' }}>
            {language === 'ar' ? "تفضيلات المظهر" : "Theme Preferences"}
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>{language === 'ar' ? "مظهر التطبيق" : "App Theme"}</span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { label: language === 'ar' ? "فاتح" : "Light", value: 'light' },
                  { label: language === 'ar' ? "داكن" : "Dark", value: 'dark' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={option.value === (dark ? 'dark' : 'light') ? 'btn-primary' : 'btn-ghost'}
                    style={{ minWidth: 120 }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="btn-ghost" onClick={toggle} style={{ width: 'fit-content' }}>
              {language === 'ar' 
                ? `التحويل إلى الوضع ${dark ? 'الفاتح' : 'الداكن'}` 
                : `Switch to ${dark ? 'Light' : 'Dark'} mode`}
            </button>
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>
            {language === 'ar' ? "إجراءات الجلسة" : "Session Actions"}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: '1.6' }}>
            {language === 'ar'
              ? "سجل خروجك عندما تنتهي من إدارة مخزونك ومبيعاتك."
              : "Log out when you are finished managing your inventory and sales."}
          </p>
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              try {
                await signOut(auth);
                navigate('/login', { replace: true });
              } catch (err) {
                console.error(err);
                toast.error(language === 'ar' ? "فشل تسجيل الخروج. يرجى المحاولة لاحقاً." : 'Unable to sign out. Please try again.');
              }
            }}
          >
            {language === 'ar' ? "تسجيل الخروج" : "Logout"}
          </button>
        </Card>
      </div>
    </div>
  );
}
