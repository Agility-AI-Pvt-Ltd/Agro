import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Button from '../components/Button';
import farmIllustration from "../assets/farm.svg";
import logo from "../assets/Icon.svg";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between overflow-x-hidden">
      <div className="container flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="max-w-xl w-full flex flex-col items-center text-center space-y-6">
          <img src={logo} alt="Agro Logo" className="w-16 lg:w-20" />
          
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-800 leading-tight">
            Grow <span className="text-[#2D5A3D]">Smarter</span>
          </h1>
          
          <p className="text-gray-500 font-medium text-lg lg:text-xl">
            {t('appIntro')}
          </p>
        </div>

        <div className="w-full max-w-lg mt-12 mb-12 relative flex justify-center items-center">
          <div className="absolute inset-0 bg-[#2D5A3D]/5 rounded-full blur-3xl transform scale-150"></div>
          <img
            src={farmIllustration}
            alt="Landing Illustration"
            className="w-full h-auto max-h-[40vh] object-contain relative z-10"
          />
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4 mt-auto lg:mt-0">
          <Button 
            onClick={() => navigate('/login')} 
            className="shadow-lg shadow-[#2D5A3D]/20 py-4"
          >
            {t('login')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/register')} 
            className="bg-white py-4"
          >
            {t('register')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
