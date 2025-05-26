import { useState, useEffect } from "react";

export type ThemeType = "default" | "modern" | "classic";

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("hospital-theme") as ThemeType;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: ThemeType) => {
    const root = document.documentElement;
    
    // إزالة جميع كلاسات التصميمات
    root.classList.remove("theme-default", "theme-modern", "theme-classic");
    
    // إضافة كلاس التصميم الجديد
    root.classList.add(`theme-${theme}`);
    
    // تطبيق المتغيرات المخصصة لكل تصميم
    switch (theme) {
      case "modern":
        root.style.setProperty("--primary-color", "59 130 246"); // blue-500
        root.style.setProperty("--secondary-color", "16 185 129"); // emerald-500
        root.style.setProperty("--background-color", "15 23 42"); // slate-900
        root.style.setProperty("--surface-color", "30 41 59"); // slate-800
        root.style.setProperty("--text-color", "248 250 252"); // slate-50
        break;
      case "classic":
        root.style.setProperty("--primary-color", "79 70 229"); // indigo-600
        root.style.setProperty("--secondary-color", "217 119 6"); // amber-600
        root.style.setProperty("--background-color", "255 255 255"); // white
        root.style.setProperty("--surface-color", "249 250 251"); // gray-50
        root.style.setProperty("--text-color", "17 24 39"); // gray-900
        break;
      default: // default theme
        root.style.setProperty("--primary-color", "14 165 233"); // sky-500
        root.style.setProperty("--secondary-color", "34 197 94"); // green-500
        root.style.setProperty("--background-color", "248 250 252"); // slate-50
        root.style.setProperty("--surface-color", "255 255 255"); // white
        root.style.setProperty("--text-color", "15 23 42"); // slate-900
        break;
    }
  };

  const changeTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem("hospital-theme", theme);
  };

  const getThemeConfig = (theme: ThemeType) => {
    const themes = {
      default: {
        name: "التصميم الافتراضي",
        description: "تصميم عصري ونظيف باللون الأزرق",
        primary: "bg-blue-600",
        secondary: "bg-green-600",
        background: "bg-slate-50"
      },
      modern: {
        name: "التصميم العصري",
        description: "تصميم داكن وأنيق للاستخدام المسائي",
        primary: "bg-blue-500",
        secondary: "bg-emerald-500",
        background: "bg-slate-900"
      },
      classic: {
        name: "التصميم الكلاسيكي",
        description: "تصميم تقليدي مريح للعين",
        primary: "bg-indigo-600",
        secondary: "bg-amber-600",
        background: "bg-white"
      }
    };
    return themes[theme];
  };

  return {
    currentTheme,
    changeTheme,
    getThemeConfig
  };
};