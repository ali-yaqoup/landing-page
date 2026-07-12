import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { Zap, Eye, EyeOff, Sun, Moon, Languages } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const { dark, toggle: toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !email.trim() || !password) {
      setError(language === 'ar' ? "جميع الحقول مطلوبة." : "All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError(language === 'ar' ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Auto-create business linked to the new user
      await addDoc(collection(db, "businesses"), {
        name: businessName.trim(),
        userId: cred.user.uid,
        createdAt: serverTimestamp(),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError(language === 'ar' ? "هذا البريد الإلكتروني مسجل بالفعل." : "This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError(language === 'ar' ? "كلمة المرور ضعيفة جداً." : "Password is too weak.");
      } else {
        setError(language === 'ar' ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "2rem 1rem",
      }}
    >
      {/* Top Bar with controls */}
      <div style={{ position: "fixed", top: 16, right: 16, left: 16, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <button
            onClick={toggleLanguage}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.4rem 0.8rem",
              cursor: "pointer",
              color: "var(--text-2)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Languages size={15} />
            {language === 'en' ? "العربية" : "English"}
          </button>
        </div>
        <div style={{ pointerEvents: "auto" }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.4rem 0.6rem",
              cursor: "pointer",
              color: "var(--text-2)",
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.4rem",
                letterSpacing: "-0.03em",
                color: "var(--text-1)",
              }}
            >
              Way<span style={{ color: "var(--accent)" }}>Tech</span>
            </span>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
            {language === 'ar' ? "أنشئ حسابك الجديد للبدء" : "Create your account to get started"}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: "0.375rem",
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}
              >
                {language === 'ar' ? "اسم المنشأة" : "Business Name"}
              </label>
              <input
                className="input"
                type="text"
                placeholder={language === 'ar' ? "مثال: بقالة الخير" : "e.g. Ali's Electronics"}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: "0.375rem",
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}
              >
                {language === 'ar' ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ textAlign: 'left', direction: 'ltr' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: "0.375rem",
                  textAlign: language === 'ar' ? 'right' : 'left'
                }}
              >
                {language === 'ar' ? "كلمة المرور" : "Password"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  placeholder={language === 'ar' ? "6 أحرف كحد أدنى" : "Min. 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    paddingLeft: language === 'ar' ? "2.5rem" : "0.75rem", 
                    paddingRight: language === 'ar' ? "0.75rem" : "2.5rem",
                    textAlign: 'left', 
                    direction: 'ltr' 
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{
                    position: "absolute",
                    right: language === 'ar' ? "auto" : 10,
                    left: language === 'ar' ? 10 : "auto",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-3)",
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "0.625rem 0.875rem",
                  borderRadius: 8,
                  background: "#fee2e21a",
                  border: "1px solid #f8717130",
                  color: "#f87171",
                  fontSize: "0.8rem",
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
              {busy 
                ? (language === 'ar' ? "جاري إنشاء الحساب..." : "Creating account…") 
                : (language === 'ar' ? "إنشاء الحساب" : "Create Account")}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-3)", marginTop: "1.25rem" }}>
            {language === 'ar' ? "لديك حساب بالفعل؟ " : "Already have an account? "}
            <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              {language === 'ar' ? "تسجيل الدخول" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
