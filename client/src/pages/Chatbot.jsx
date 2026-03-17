import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotService } from '../services/chatbot.service';
import toast from 'react-hot-toast';

const PREDEFINED_QUESTIONS = [
  { id: "1", text: "What farm operations should I do today/tomorrow for my crop?" },
  { id: "2", text: "Is there any weather risk for my crop in the next 7 days?" },
  { id: "3", text: "When to apply fertilizer or pesticide?" },
  { id: "4", text: "My crop is showing disease symptoms – what should I do?" },
  { id: "5", text: "Show common diseases for my crop at this stage" },
  { id: "6", text: "How can I protect my Maize crop from heat?" },
  { id: "7", text: "What best practices should I follow at my crop's current stage?" },
];

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'bot', type: 'greeting', content: 'Hello! I am Samarth AI, your agricultural assistant. How can I help you today?' },
    { role: 'bot', type: 'predefined', content: PREDEFINED_QUESTIONS }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Retry state
  const [isRequestingData, setIsRequestingData] = useState(false);
  const [pendingOriginalMessage, setPendingOriginalMessage] = useState(null); // { type: 'custom' | 'predefined', value: string }
  const [sowingDateInput, setSowingDateInput] = useState('');
  const [locationState, setLocationState] = useState({ lat: null, lng: null, loading: false, error: '' });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isRequestingData]);

  const addMessage = (role, content, type = 'text') => {
    setMessages(prev => [...prev, { role, content, type }]);
  };

  const processApiResponse = (res, originalMsg) => {
    if (res.success) {
      addMessage('bot', res.data?.message || res.message, 'text');
      if (res.data?.weather) {
         // Optionally append a weather snippet
         addMessage('bot', res.data.weather, 'weather');
      }
    } else {
      // API error handled by backend structure
      addMessage('bot', res.message || "An error occurred.", 'text');
    }
  };

  const handleApiError = (err, originalMsg) => {
    const errorData = err.response?.data;
    if (errorData?.error === "requires_location_and_date" || errorData?.error === "no_active_crop") {
      setPendingOriginalMessage(originalMsg);
      addMessage('bot', errorData.message || "Please enter your sowing date and location to continue.", 'text');
      setIsRequestingData(true);
    } else {
      addMessage('bot', errorData?.message || "AI service is temporarily unavailable. Please try again.", 'text');
    }
  };

  const sendCustomMessage = async (text, extraData = {}) => {
    if (!text.trim() || loading) return;
    
    // Only add user message to UI if it's the first attempt, not a background retry
    if (!extraData.isRetry) {
      addMessage('user', text, 'text');
      setInputMessage('');
    }
    
    setLoading(true);
    try {
      const res = await chatbotService.sendCustomMessage(text, extraData);
      processApiResponse(res, { type: 'custom', value: text });
    } catch (err) {
      handleApiError(err, { type: 'custom', value: text });
    } finally {
      setLoading(false);
    }
  };

  const sendPredefinedMessage = async (questionObj, extraData = {}) => {
    if (loading) return;

    if (!extraData.isRetry) {
      addMessage('user', questionObj.text, 'text');
    }

    setLoading(true);
    try {
      const res = await chatbotService.sendPredefinedMessage(questionObj.id, extraData);
      processApiResponse(res, { type: 'predefined', value: questionObj });
    } catch (err) {
      handleApiError(err, { type: 'predefined', value: questionObj });
    } finally {
      setLoading(false);
    }
  };

  // Missing Data Form Logic
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
       setLocationState({ lat: null, lng: null, loading: false, error: 'Geolocation is not supported by your browser' });
       return toast.error('Geolocation is not supported by your browser');
    }
    
    setLocationState(prev => ({ ...prev, loading: true, error: '' }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: ''
        });
        toast.success('Location acquired');
      },
      (error) => {
        setLocationState({ lat: null, lng: null, loading: false, error: error.message });
        toast.error('Could not get location. Please allow permissions.');
      }
    );
  };

  const submitMissingData = () => {
    if (!sowingDateInput || locationState.lat === null || locationState.lng === null) {
      toast.error("Please provide both sowing date and location");
      return;
    }

    setIsRequestingData(false);
    const extraData = {
      sowing_date: sowingDateInput,
      latitude: locationState.lat,
      longitude: locationState.lng,
      isRetry: true
    };

    // Retry the original message
    if (pendingOriginalMessage?.type === 'custom') {
      sendCustomMessage(pendingOriginalMessage.value, extraData);
    } else if (pendingOriginalMessage?.type === 'predefined') {
      sendPredefinedMessage(pendingOriginalMessage.value, extraData);
    }
    setPendingOriginalMessage(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#2D5A3D] to-[#1D3D28] text-white py-4 px-6 shadow-md z-10 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors pb-[10px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center p-[2px]">
             <img src="/MessageCircle.svg" alt="bot" className="w-6 h-6 hue-rotate-[120deg] brightness-75" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1D3D28] rounded-full"></div>
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Samarth AI</h1>
            <p className="text-xs text-green-100/80">Agricultural Assistant</p>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full animate-fade-in-up`}>
            
            {/* BOT MESSAGES */}
            {msg.role === 'bot' && (
              <div className="flex gap-3 max-w-[85%] lg:max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] flex-shrink-0 flex items-center justify-center mt-1">
                  <img src="/MessageCircle.svg" alt="bot" className="w-4 h-4 invert brightness-0" />
                </div>
                
                <div className="flex flex-col gap-2">
                  {msg.type === 'greeting' && (
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-gray-800">
                      {msg.content}
                    </div>
                  )}

                  {msg.type === 'text' && (
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  )}

                  {/* PREDEFINED OPTIONS OVERLAY IN CHAT */}
                  {msg.type === 'predefined' && (
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1 mb-1">Suggested Questions</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.content.map(q => (
                           <button 
                             key={q.id}
                             disabled={loading || isRequestingData}
                             onClick={() => sendPredefinedMessage(q)}
                             className="text-left bg-green-50/80 hover:bg-[#E8F3EE] active:bg-[#D4E8DF] border border-green-200/50 text-[#2D5A3D] px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {q.text}
                           </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.type === 'weather' && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl shadow-sm border border-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                         <img src="/Cloud.svg" className="w-5 h-5 opacity-70" /> Weather Info
                      </h4>
                      <div className="text-sm text-blue-800/90 whitespace-pre-wrap">
                        {JSON.stringify(msg.content, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USER SETTINGS / TEXT */}
            {msg.role === 'user' && (
               <div className="bg-[#2D5A3D] text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[85%] lg:max-w-[70%]">
                 {msg.content}
               </div>
            )}
            
          </div>
        ))}
        
        {/* MISSING DATA FORM */}
        {isRequestingData && (
          <div className="flex justify-start w-full animate-fade-in-up">
            <div className="flex gap-3 max-w-[90%] lg:max-w-[60%]">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex-shrink-0 flex items-center justify-center mt-1">
                 <span className="text-white font-bold text-sm">!</span>
              </div>
              <div className="bg-[#FFFBEB] p-5 rounded-2xl rounded-tl-none shadow-sm border border-[#FDE68A] text-gray-800 w-full flex flex-col gap-4">
                 <h4 className="font-semibold text-[#D97706]">Required Context</h4>
                 
                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm text-gray-600 font-medium">Sowing Date</label>
                   <input 
                     type="date" 
                     value={sowingDateInput}
                     onChange={e => setSowingDateInput(e.target.value)}
                     className="p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#2D5A3D] bg-white text-sm"
                   />
                 </div>

                 <div className="flex flex-col gap-1.5">
                   <label className="text-sm text-gray-600 font-medium">Location Coordinates</label>
                   <div className="flex gap-2 items-center">
                     <button 
                       onClick={handleGetLocation} 
                       disabled={locationState.loading}
                       className="flex items-center gap-2 bg-[#2D5A3D] text-white px-4 py-2.5- rounded-xl text-sm font-medium hover:bg-[#1D3D28] transition-colors flex-1 justify-center py-[10px]"
                     >
                       {locationState.loading ? 'Locating...' : 'Use Current Location'}
                     </button>
                   </div>
                   {locationState.lat && <p className="text-xs text-green-700 mt-1 font-medium bg-green-50 p-2 rounded-lg inline-block w-fit">📍 Location acquired: {locationState.lat.toFixed(4)}, {locationState.lng.toFixed(4)}</p>}
                   {locationState.error && <p className="text-xs text-red-500 mt-1">{locationState.error}</p>}
                 </div>

                 <button 
                    onClick={submitMissingData}
                    className="mt-2 w-full bg-gradient-to-r from-[#2D5A3D] to-[#254A32] text-white p-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                 >
                    Submit & Continue
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* TYPING INDICATOR */}
        {loading && (
          <div className="flex justify-start w-full animate-fade-in-up mt-4">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] flex-shrink-0 flex items-center justify-center mt-1">
                <img src="/MessageCircle.svg" alt="bot" className="w-4 h-4 invert brightness-0" />
              </div>
              <div className="bg-white p-4 py-5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-1.5 w-20">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
      </div>

      {/* INPUT AREA */}
      <div className="bg-white p-4 xs:p-5 border-t border-gray-200 z-10 shrink-0 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendCustomMessage(inputMessage); }}
          className="flex items-center gap-3 w-full max-w-4xl mx-auto relative"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isRequestingData ? "Provide data above to continue..." : "Type your question..."}
              disabled={loading || isRequestingData}
              className="w-full bg-gray-100/80 border-transparent focus:bg-white focus:border-[#2D5A3D] focus:ring-4 focus:ring-green-500/10 rounded-full py-3.5 pl-6 pr-12 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {/* Optional Mic Icon visually positioned inside the input */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer opacity-40 hover:opacity-80 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
             </div>
          </div>
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || loading || isRequestingData}
            className="bg-[#2D5A3D] text-white p-3.5 rounded-full hover:bg-[#1D3D28] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
};

export default Chatbot;
