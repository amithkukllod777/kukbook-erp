import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("kukbook-lang", newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
      title={i18n.language === "en" ? "हिंदी में बदलें" : "Switch to English"}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {i18n.language === "en" ? "हिंदी" : "English"}
      </span>
    </button>
  );
}
