import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      <p className="font-medium text-sm mb-2 flex items-center gap-2 text-gray-600">
        <Globe size={18} className="text-[#2D5A3D]" />
        {t('Select Your Language')}
      </p>
      <div className="flex w-full gap-3">
        <button
          onClick={() => toggleLanguage('en')}
          className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all
            ${i18n.language === 'en'
              ? 'bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] text-white shadow-md shadow-[#2D5A3D]/20'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
        >
          English
        </button>

        <button
          onClick={() => toggleLanguage('hi')}
          className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all
            ${i18n.language === 'hi'
              ? 'bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] text-white shadow-md shadow-[#2D5A3D]/20'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
