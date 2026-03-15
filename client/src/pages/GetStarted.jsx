import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Button from '../components/Button';
import logo from "../assets/Icon.svg";
import farmIllustration from "../assets/farm.svg";

const GetStarted = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (


    <div
      className="
      h-screen
      flex flex-col
      lg:flex-row
      bg-cover 
      
      "
      style={{
        backgroundImage: `url(${farmIllustration})`,
        backgroundPosition: "center -180px"
      }}
    >
      <div className="lg:hidden absolute inset-0 bg-black/30"></div>
      {/* MOBILE HERO CONTENT */}
      <div className="lg:hidden w-full absolute top-0 left-0 z-10 p-6 flex flex-col items-center text-center">

        <img src={logo} alt="App Logo" className="w-14 mb-3" />

        <h2 className="text-2xl text-white font-light">
          Samarth Mitra
        </h2>

        <p className="text-white/80 text-sm mb-4">
          Smart Farming Guidance for India
        </p>

        <h1 className="text-3xl font-bold mt-10 text-white leading-tight">
          Smart Farming Advice Based on
          Weather & Crop Stage
        </h1>

      </div>

      {/* LEFT SIDE (DESKTOP ONLY) */}
      <div className="hidden lg:block w-[60%] h-screen">

        <div
          className="flex h-full pb-30 items-center bg-cover bg-center"
          style={{ backgroundImage: `url(${farmIllustration})`, }}
        >

          <div className="absolute inset-0 bg-black/20"></div>

          <div className="relative z-10">
            <div className="flex flex-col gap-12  px-12 max-w-2xl">

              <div>
                <img src={logo} alt="App Logo" className="w-20 mb-4" />
                <h2 className="text-4xl text-white font-light">
                  Samarth Mitra
                </h2>
                <p className="text-white/80 text-lg">
                  Smart Farming Guidance for India
                </p>
              </div>

              <h1 className="text-5xl font-bold text-white leading-tight">
                Smart Farming Advice Based on
                Weather & Crop Stage
              </h1>

              <p className="text-white/80 text-xl max-w-xl">
                Get guidance tailored to your farm, powered by AI
                and local weather data.
              </p>

            </div>
          </div>
        </div>
      </div>


      {/* RIGHT CARD */}
      <div
        className="
        lg:w-[40%]
        w-full
        mt-auto
        flex
        lg:mt-0
     
        lg:h-[100vh]
        items-end
        lg:items-center
        justify-center
        bg-black/30
        lg:bg-gradient-to-b
        lg:from-[#F0F9F4]
        lg:to-[#E8F5E9]
        p-0
        lg:p-6
        lg:z-10
        z-10
        "
      >

        <div
          className="
          bg-[#CFE8D6]
          lg:bg-white
          w-full
          lg:w-[80%]
          rounded-t-3xl
          lg:rounded-3xl
          p-6
          lg:p-10
          shadow-xl
          lg:h-[80%]
          lg:max-h-[90vh]
          lg:h-auto
          lg:overflow-y-auto
          "
        >
          <div className='hidden lg:block'>
            <div className='flex flex-col mt-3 items-center'>
              <img src={logo} alt="logo" className="w-10 mb-2 lg:hidden" />


              <h1 className='text-2xl lg:text-[28px] font-bold text-center'>
                Welcome to Samarth Mitra
              </h1>



              <p className='text-gray-600 text-sm mt-2 text-center'>
                start your journey to smarter farming decisions
              </p>
            </div>
          </div>


          <div className='mt-6 lg:mt-15 flex flex-col'>

            <LanguageSwitcher />

            <Button
              className="mt-6 py-4 rounded-3xl"
              onClick={() => navigate('/register')}
            >
              {t('getStarted')}
            </Button>

            <p className='text-center text-sm mt-3'>
              Already have an account?
              <span
                className='text-blue-600 font-bold cursor-pointer ml-1'
                onClick={() => navigate('/login')}
              >
                Login
              </span>
            </p>

          </div>

          <div className="w-[90%] h-px bg-gray-300 my-8 mx-auto"></div>

          <div className='flex flex-col items-center gap-6'>

            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-300 bg-yellow-50 shadow-sm">
              <span className="text-yellow-500 text-xl">✨</span>
              <span className="text-gray-700 font-medium">
                AI Powered Advisory
              </span>
            </div>
            <div className="hidden lg:flex lg:items-center">

              <div className="flex flex-col items-center px-7">
                <h2 className="text-2xl font-bold text-green-800">100K+</h2>
                <p className="text-gray-500">Farmers</p>
              </div>

              <div className="h-12 w-px bg-gray-300"></div>

              <div className="flex flex-col items-center px-8">
                <h2 className="text-2xl font-bold text-green-800">20+</h2>
                <p className="text-gray-500">Crops</p>
              </div>

              <div className="h-12 w-px bg-gray-300"></div>

              <div className="flex flex-col items-center px-8">
                <h2 className="text-2xl font-bold text-green-800">500+</h2>
                <p className="text-gray-500">Cities</p>
              </div>

            </div>

            <p className="text-gray-500 text-sm">
              Built for Indian Farmers
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

export default GetStarted;