
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trip, Activity, ActivityType, DailyPlan, ChatMessage } from './types';
import { createBlankTrip } from './services/presetTrip';
import { supabase } from './lib/supabase';
import { 
  ActivityIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  CheckIcon,
  NoteIcon,
  CloseIcon,
  WalletIcon,
  MapIcon,
  CoffeeIcon,
  CameraIcon,
  BedIcon,
  SparklesIcon,
  ArrowRightIcon,
  HomeIcon,
  CalendarIcon,
  HeartIcon,
  ShoppingBagIcon,
  PlaneIcon,
  CarIcon,
  BackIcon
} from './components/Icons';
import { sendChatMessage } from './services/geminiService';

// --- Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getFormattedDate = (startDate: string | undefined, dayOffset: number) => {
  if (!startDate) return `DAY ${dayOffset + 1}`;
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
};

const getDayOfMonth = (startDate: string | undefined, dayOffset: number) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.getDate();
};

const getDaysUntil = (startDate: string | undefined) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const isToday = (startDate: string | undefined, dayNumber: number) => {
  if (!startDate) return false;
  const targetDate = new Date(startDate);
  targetDate.setDate(targetDate.getDate() + dayNumber - 1);
  const now = new Date();
  return targetDate.toDateString() === now.toDateString();
};

const isActivityOngoing = (activityTime: string, nextActivityTime?: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [h, m] = activityTime.split(':').map(Number);
  const startMinutes = h * 60 + m;
  
  if (nextActivityTime) {
    const [nh, nm] = nextActivityTime.split(':').map(Number);
    const endMinutes = nh * 60 + nm;
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < startMinutes + 120;
};

// --- Activity Modal ---
interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  initialData?: Activity | null;
  initialType?: ActivityType;
  exchangeRate: number;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, onSave, initialData, initialType, exchangeRate }) => {
  const [formData, setFormData] = useState<Activity>({
    id: '', time: '09:00', title: '', description: '', location: '',
    customMapLink: '', type: 'sightseeing', cost: 0, notes: '', isBooked: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...initialData, 
        cost: initialData.cost ?? 0,
        customMapLink: initialData.customMapLink ?? '',
        notes: initialData.notes ?? ''
      });
    } else {
      setFormData({
        id: generateId(), time: '09:00', title: '', description: '', location: '',
        customMapLink: '', type: initialType || 'sightseeing', cost: 0, notes: '', isBooked: false
      });
    }
  }, [initialData, isOpen, initialType]);

  if (!isOpen) return null;

  const myrEquivalent = (formData.cost || 0) * exchangeRate;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl z-10 p-6 sm:p-8 animate-fadeIn flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden text-slate-800">
        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold">{initialData ? 'Edit Activity' : 'Add Activity'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-slate-400" /></button>
        </div>
        <div className="space-y-6 overflow-y-auto pr-2 flex-1 no-scrollbar">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 sm:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Time</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
            </div>
            <div className="col-span-7 sm:col-span-5">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ActivityType})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium">
                <option value="food">Food & Dining</option>
                <option value="sightseeing">Sightseeing</option>
                <option value="shopping">Shopping</option>
                <option value="relaxation">Relaxation</option>
                <option value="travel">Transit/Flight</option>
                <option value="drive">Driving/Car</option>
                <option value="stay">Hotel/Stay</option>
                <option value="other">Other Activity</option>
              </select>
            </div>
            <div className="col-span-12 sm:col-span-4 flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isBooked ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}>
                  {formData.isBooked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <input type="checkbox" checked={formData.isBooked || false} onChange={e => setFormData({...formData, isBooked: e.target.checked})} className="hidden" />
                <span className={`text-sm font-bold ${formData.isBooked ? 'text-green-700' : 'text-slate-500'}`}>{formData.isBooked ? 'Booked!' : 'Mark Booked'}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Activity Title</label>
            <input type="text" placeholder="e.g., Dinner at the pier" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-lg font-medium" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location</label>
              <input type="text" placeholder="Address or Place" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Map Link (Optional)</label>
              <input type="text" placeholder="Google Maps URL" value={formData.customMapLink || ''} onChange={e => setFormData({...formData, customMapLink: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                <textarea rows={3} placeholder="Details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cost (JPY)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400 text-sm">¥</span>
                  <input type="number" placeholder="0" value={formData.cost === undefined ? '' : formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className="w-full p-3 pl-7 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
                  <div className="mt-1 text-[10px] font-bold text-rose-400">≈ RM {myrEquivalent.toFixed(2)}</div>
                </div>
             </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => onSave(formData)} disabled={!formData.title} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2">
            <SaveIcon className="w-5 h-5" /> <span>Save Activity</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Budget Modal ---
const BudgetModal = ({ isOpen, onClose, trip, exchangeRate }: { isOpen: boolean, onClose: () => void, trip: Trip, exchangeRate: number }) => {
  if (!isOpen) return null;
  let total = 0;
  const categoryTotals: Record<string, number> = { food: 0, sightseeing: 0, relaxation: 0, travel: 0, stay: 0, shopping: 0, drive: 0, other: 0 };
  trip.dailyPlans.forEach(plan => plan.activities.forEach(act => {
    const c = act.cost ?? 0;
    total += c;
    if (categoryTotals[act.type] !== undefined) categoryTotals[act.type] += c; else categoryTotals['other'] += c;
  }));
  const maxCost = Math.max(...Object.values(categoryTotals), 1);
  const totalMYR = total * exchangeRate;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-md transition-opacity" onClick={onClose}></div>
       <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl z-10 p-8 flex flex-col max-h-[85vh] animate-slideUp text-slate-800">
         <div className="flex justify-between items-center mb-8">
           <div className="flex items-center space-x-3 text-rose-600">
             <WalletIcon className="w-6 h-6" />
             <h3 className="text-2xl font-serif font-bold text-rose-950">Budget Summary</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full"><CloseIcon className="w-6 h-6" /></button>
         </div>
         <div className="overflow-y-auto pr-2 space-y-8 flex-1 no-scrollbar">
            <div className="bg-rose-600 rounded-[2rem] p-8 text-white text-center shadow-lg relative overflow-hidden">
               <p className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2">Estimated Total Cost</p>
               <h2 className="text-5xl font-serif font-bold mb-1">¥ {total.toLocaleString()}</h2>
               <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-bold">≈ RM {totalMYR.toFixed(2)}</div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">By Category</h4>
              {Object.entries(categoryTotals).map(([cat, cost]) => {
                if (cost === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span className="capitalize">{cat}</span>
                      <div className="text-right">
                        <span>¥{cost.toLocaleString()}</span>
                        <span className="ml-2 text-rose-300 text-xs">RM {(cost * exchangeRate).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${
                        cat === 'food' ? 'bg-orange-400' : 
                        cat === 'stay' ? 'bg-emerald-400' :
                        cat === 'travel' ? 'bg-sky-400' : 
                        cat === 'drive' ? 'bg-indigo-400' :
                        cat === 'shopping' ? 'bg-purple-400' :
                        'bg-rose-400'
                      }`} style={{ width: `${(cost / maxCost) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {total === 0 && <p className="text-center text-slate-400 italic py-8">No costs recorded yet.</p>}
            </div>
         </div>
       </div>
    </div>
  );
};

// --- Subway Map Viewer Modal (Updated) ---
const SubwayMapModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl z-10 p-6 flex flex-col h-[90vh] animate-slideUp overflow-hidden border border-rose-100 text-slate-800">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-2.5 bg-rose-50 rounded-2xl"><MapIcon className="w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-rose-950">Subway Map</h3>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Tokyo Subway Route Map</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-1 rounded-[2rem] border border-slate-100 overflow-hidden bg-slate-100 relative group flex flex-col">
           <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-rose-200 cursor-grab active:cursor-grabbing">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Tokyo_Metro_Subway_Map.svg/2560px-Tokyo_Metro_Subway_Map.svg.png" 
                alt="Tokyo Subway Route Map" 
                className="max-w-none w-[350%] md:w-[150%] h-auto rounded-lg shadow-2xl"
              />
           </div>
           <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
              <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                 Scroll or Pinch to Zoom
              </div>
              <a 
                href="https://www.tokyometro.jp/en/subwaymap/pdf/en_tokyo_metro_route_map.pdf" 
                target="_blank" rel="noreferrer"
                className="pointer-events-auto bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-rose-700 transition-colors"
              >
                <span>Full PDF</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
           </div>
        </div>
        
        <div className="mt-3 flex-shrink-0 text-center">
           <p className="text-[9px] text-slate-300 uppercase tracking-tighter">Route Map provided by Tokyo Metro Co., Ltd. (via Wikimedia Commons)</p>
        </div>
      </div>
    </div>
  );
};

// --- Chat Assistant ---
const ChatAssistant = ({ isOpen, onClose, currentTrip }: { isOpen: boolean, onClose: () => void, currentTrip?: Trip | null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ 
        id: 'init', 
        role: 'model', 
        text: currentTrip 
          ? `Hi! I'm ready to help with your trip to ${currentTrip.destination}. Need suggestions for a specific day or help finding a restaurant nearby?`
          : `Hi! I'm your travel assistant. Start by creating a trip!`
      }]);
    }
  }, [isOpen, currentTrip, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !currentTrip) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.filter(m => m.id !== 'init').map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const result = await sendChatMessage(input, history, currentTrip);
      
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const text = result.text || "I found some info for you.";

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        groundingMetadata: groundingChunks
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, connection error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-white/95 w-full h-[85vh] sm:h-[600px] sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-slideUp border border-white/50">
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5" />
            <span className="font-bold">Trip Assistant</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <BackIcon className="w-6 h-6 rotate-[-90deg] sm:rotate-0" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-none shadow-rose-200' 
                  : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                {msg.groundingMetadata && (
                   <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sources</div>
                     {msg.groundingMetadata.map((chunk: any, i: number) => (
                       chunk.web && (
                         <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-500 hover:underline truncate">
                           {chunk.web.title || chunk.web.uri}
                         </a>
                       )
                     ))}
                   </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex items-center space-x-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 focus-within:border-rose-400 transition-all shadow-inner">
            <input
              type="text"
              placeholder="Ask about your trip..."
              className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [view, setView] = useState<'dashboard' | 'itinerary'>('dashboard');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [addingType, setAddingType] = useState<ActivityType | undefined>(undefined);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isMetroGuideOpen, setIsMetroGuideOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTheme, setEditingTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0.03); 
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('trips').select('data').eq('id', 'our-trip-id').single();
      if (data && !error) setTrip(data.data);
      else setTrip(createBlankTrip());
      setIsLoading(false);
    };
    loadTrip();
  }, []);

  useEffect(() => {
    if (!trip || isLoading) return;
    const saveTrip = async () => { await supabase.from('trips').upsert({ id: 'our-trip-id', data: trip }); };
    const timer = setTimeout(saveTrip, 1000);
    return () => clearTimeout(timer);
  }, [trip, isLoading]);

  const currentDayPlan = useMemo(() => trip?.dailyPlans.find(d => d.dayNumber === activeDay), [trip, activeDay]);
  const sortedActivities = useMemo(() => currentDayPlan ? [...currentDayPlan.activities].sort((a, b) => a.time.localeCompare(b.time)) : [], [currentDayPlan]);
  
  const totalBudgetJPY = useMemo(() => {
    if (!trip) return 0;
    return trip.dailyPlans.reduce((sum, plan) => sum + plan.activities.reduce((s, a) => s + (a.cost ?? 0), 0), 0);
  }, [trip]);
  
  const dayTotalJPY = useMemo(() => sortedActivities.reduce((sum, act) => sum + (act.cost ?? 0), 0), [sortedActivities]);
  const dayTotalMYR = useMemo(() => dayTotalJPY * exchangeRate, [dayTotalJPY, exchangeRate]);
  const isSelectedDayToday = useMemo(() => isToday(trip?.startDate, activeDay), [trip?.startDate, activeDay]);

  if (!trip || isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-rose-400 animate-pulse text-xl italic">Setting up our romance...</div>;

  const handleUpdate = (t: Trip) => setTrip({ ...t });
  const handleSaveActivity = (activity: Activity) => {
    const updatedPlans = trip.dailyPlans.map(plan => {
      if (plan.dayNumber === activeDay) {
        const activities = editingActivity ? plan.activities.map(a => a.id === activity.id ? activity : a) : [...plan.activities, activity];
        return { ...plan, activities };
      }
      return plan;
    });
    handleUpdate({ ...trip, dailyPlans: updatedPlans });
    setIsActivityModalOpen(false);
    setEditingActivity(null);
    setAddingType(undefined);
  };

  const handleDeleteActivity = (id: string) => {
    if (!confirm('Delete activity?')) return;
    const updatedPlans = trip.dailyPlans.map(plan => {
      if (plan.dayNumber === activeDay) return { ...plan, activities: plan.activities.filter(a => a.id !== id) };
      return plan;
    });
    handleUpdate({ ...trip, dailyPlans: updatedPlans });
  };

  const addDay = () => {
    const newDayNum = trip.dailyPlans.length + 1;
    const newDay: DailyPlan = { id: generateId(), dayNumber: newDayNum, activities: [], theme: `New Adventure` };
    handleUpdate({ ...trip, duration: newDayNum, dailyPlans: [...trip.dailyPlans, newDay] });
    setActiveDay(newDayNum);
  };

  if (view === 'dashboard') {
    const daysUntil = getDaysUntil(trip.startDate);
    return (
      <div className="min-h-screen flex flex-col sakura-bg animate-fadeIn">
        <header className="bg-transparent p-4">
           <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="w-10"></div>
              <div 
                className="relative bg-white p-4 rounded-full shadow-lg border border-rose-100 group cursor-pointer active:scale-95 transition-all"
                onClick={() => setView('itinerary')}
              >
                <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-10 group-hover:opacity-30"></div>
                <HeartIcon className="w-8 h-8 text-rose-500 relative" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsChatOpen(true)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-full"><SparklesIcon className="w-5 h-5" /></button>
                <button onClick={() => setIsNotesOpen(!isNotesOpen)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full"><NoteIcon className="w-5 h-5" /></button>
              </div>
           </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col items-center justify-center space-y-8">
           <section className="text-center py-4 space-y-3">
              <h2 className="text-5xl font-serif font-bold text-slate-800 tracking-tight leading-tight">{trip.destination}</h2>
              <p className="text-rose-400 font-bold tracking-[0.2em] uppercase text-xs">Journey for Vin & Dolly</p>
              {daysUntil !== null && (
                <div className="mt-6">
                  <div className="bg-rose-50 inline-block px-8 py-3 rounded-full border border-rose-100 shadow-sm">
                    <span className="text-rose-600 font-bold text-sm tracking-wide">
                      {daysUntil > 0 ? `${daysUntil} Days To Go! ❤️` : daysUntil === 0 ? "It's Travel Day! ✈️" : "Memories made!"}
                    </span>
                  </div>
                </div>
              )}
           </section>
           
           <div className="w-full max-w-sm pt-8">
              <button 
                onClick={() => setView('itinerary')} 
                className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[2.5rem] font-bold shadow-xl shadow-rose-100 transition-all active:scale-[0.98] text-lg mb-4"
              >
                Open Our Itinerary
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setIsMetroGuideOpen(true)} className="py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <MapIcon className="w-4 h-4" /> 
                    <span>Subway Map</span>
                 </button>
                 <button onClick={() => setIsBudgetOpen(true)} className="py-4 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-[2rem] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <WalletIcon className="w-4 h-4" /> 
                    <span>Budget</span>
                 </button>
              </div>
           </div>
        </main>

        {isNotesOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsNotesOpen(false)}></div>
             <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl z-10 animate-slideUp text-slate-800 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="font-serif font-bold text-2xl text-rose-950">Settings</h3><button onClick={() => setIsNotesOpen(false)}><CloseIcon className="w-6 h-6 text-slate-400" /></button></div>
                <div className="space-y-6">
                  <div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Trip Start Date</label><input type="date" className="w-full p-4 bg-rose-50 rounded-2xl outline-none" value={trip.startDate || ''} onChange={e => handleUpdate({...trip, startDate: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Exchange Rate (100 JPY to MYR)</label><div className="flex items-center gap-2 bg-rose-50 p-4 rounded-2xl"><input type="number" step="0.01" className="bg-transparent border-b border-rose-300 outline-none w-20 text-center font-bold" value={(exchangeRate * 100).toFixed(2)} onChange={e => setExchangeRate((parseFloat(e.target.value) || 0) / 100)} /><span className="text-xs font-bold">MYR</span></div></div>
                </div>
             </div>
          </div>
        )}
        <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentTrip={trip} />
        <SubwayMapModal isOpen={isMetroGuideOpen} onClose={() => setIsMetroGuideOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col sakura-bg">
       <header className={`bg-white/95 backdrop-blur-md sticky top-0 z-[60] border-b border-rose-100 transition-all duration-300 ${isScrolled ? 'py-1 shadow-md' : 'py-3'}`}>
         <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between gap-2 mb-2">
               <button onClick={() => setView('dashboard')} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full flex-shrink-0"><HomeIcon className="w-5 h-5" /></button>
               <div className="flex-1 text-center min-w-0" onClick={() => setEditingTitle(true)}>
                  {editingTitle ? (
                    <input autoFocus className="font-serif font-bold text-lg outline-none w-full border-b-2 border-rose-200 bg-transparent text-center text-slate-800" defaultValue={trip.destination} onBlur={e => { handleUpdate({...trip, destination: e.target.value}); setEditingTitle(false); }} />
                  ) : (
                    <div className="flex flex-col items-center">
                      <h2 className={`font-serif font-bold text-rose-950 truncate transition-all ${isScrolled ? 'text-sm' : 'text-base'}`}>
                        {trip.destination}
                      </h2>
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-1">
                  <button onClick={() => setIsChatOpen(true)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors"><SparklesIcon className="w-5 h-5" /></button>
                  <button onClick={() => setIsMetroGuideOpen(true)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><MapIcon className="w-5 h-5" /></button>
                  <button onClick={() => setIsBudgetOpen(true)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><WalletIcon className="w-5 h-5" /></button>
               </div>
            </div>
            
            {/* DATE SELECTOR */}
            <div className="overflow-x-auto scroll-smooth no-scrollbar -mx-4 px-4 py-2 select-none touch-pan-x active:cursor-grabbing">
              <div className="flex gap-2 w-max items-center flex-nowrap pr-12 min-w-full">
                 {trip.dailyPlans.map(p => (
                   <button 
                     key={p.id} 
                     onClick={() => { setActiveDay(p.dayNumber); setIsNotesOpen(false); }} 
                     className={`flex flex-col items-center justify-center rounded-2xl border transition-all flex-shrink-0 ${isScrolled ? 'w-[3.4rem] h-11' : 'w-[4.2rem] h-13'} ${activeDay === p.dayNumber && !isNotesOpen ? 'bg-rose-900 border-rose-900 text-white shadow-md scale-105' : 'bg-white border-rose-100 text-rose-400 hover:border-rose-300'}`}
                   >
                      <span className="text-[8px] font-bold uppercase opacity-70">Day {p.dayNumber}</span>
                      <span className="text-xs font-bold leading-none mt-0.5">{getDayOfMonth(trip.startDate, p.dayNumber - 1) || p.dayNumber}</span>
                   </button>
                 ))}
                 <button onClick={addDay} className={`flex items-center justify-center text-rose-200 flex-shrink-0 bg-white border border-dashed border-rose-200 rounded-2xl hover:border-rose-400 hover:text-rose-400 transition-colors ${isScrolled ? 'w-[3rem] h-11' : 'w-[3.5rem] h-13'}`} title="Add Day"><PlusIcon className="w-5 h-5" /></button>
              </div>
            </div>
         </div>
       </header>

       <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-40">
           <div className="space-y-6 animate-fadeIn">
             <div className="flex items-center justify-between px-1">
                <div onClick={() => setEditingTheme(true)} className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">{getFormattedDate(trip.startDate, activeDay - 1)}</div>
                  {editingTheme ? (
                    <input autoFocus className="text-xl font-serif font-bold text-rose-950 border-b border-rose-100 outline-none bg-transparent w-full" defaultValue={currentDayPlan?.theme} onBlur={e => { handleUpdate({...trip, dailyPlans: trip.dailyPlans.map(p => p.dayNumber === activeDay ? {...p, theme: e.target.value} : p)}); setEditingTheme(false); }} />
                  ) : (
                    <h2 className="text-xl font-serif font-bold text-rose-950 flex items-center gap-2 truncate group cursor-pointer">Day {activeDay}: {currentDayPlan?.theme} <EditIcon className="w-3 h-3 text-rose-200 group-hover:text-rose-400 transition-colors" /></h2>
                  )}
                </div>
                <div className="text-right ml-4 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-100 flex-shrink-0 text-slate-800 shadow-sm">
                   <div className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter italic text-center">Daily Total</div>
                   <div className="font-bold text-rose-950 text-sm">¥{dayTotalJPY.toLocaleString()}</div>
                   <div className="text-[9px] font-bold text-rose-400 text-center">≈ RM {dayTotalMYR.toFixed(2)}</div>
                </div>
             </div>

             <div className="relative border-l-2 border-rose-200/50 ml-4 sm:ml-6 space-y-6 pb-4 pl-6 sm:pl-10 text-slate-800">
               {sortedActivities.length === 0 && <div className="py-24 text-center border-2 border-dashed border-rose-100 rounded-[3rem] text-rose-300 italic ml-[-2rem]">Empty schedule for today.</div>}
               {sortedActivities.map((act, idx) => {
                 const ongoing = isSelectedDayToday && isActivityOngoing(act.time, sortedActivities[idx+1]?.time);
                 return (
                   <div key={act.id} className="relative group">
                      <div className={`absolute -left-[33px] sm:-left-[49px] top-6 w-4 h-4 rounded-full border-2 bg-white z-10 transition-all ${ongoing ? 'border-rose-500 ring-8 ring-rose-100 scale-125' : (act.isBooked ? 'border-green-500' : 'border-rose-300')}`}></div>
                      <div onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className={`group bg-white/95 backdrop-blur-sm p-4 rounded-[2rem] shadow-sm border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${act.isBooked ? 'border-l-8 border-l-green-400 shadow-green-50' : 'border-white hover:border-rose-100 shadow-rose-50/50'}`}>
                          <div className="flex justify-between items-start mb-2 gap-2 text-slate-800">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">{act.time}</span>
                              <h4 className="font-bold text-sm truncate">{act.title}</h4>
                            </div>
                            <button onClick={e => { e.stopPropagation(); handleDeleteActivity(act.id); }} className="p-1 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><TrashIcon className="w-3.5 h-3.5" /></button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mb-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                              act.type === 'food' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              act.type === 'sightseeing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              act.type === 'shopping' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              act.type === 'relaxation' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                              act.type === 'stay' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              act.type === 'travel' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                              act.type === 'drive' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                              <ActivityIcon type={act.type} className="w-3 h-3" />
                              <span className="uppercase font-bold tracking-widest">{act.type}</span>
                            </div>
                            
                            {(act.cost ?? 0) > 0 && <span className="text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-xl border border-rose-100">¥{(act.cost ?? 0).toLocaleString()}</span>}
                            {act.isBooked && <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-xl border border-green-100 flex items-center gap-1"><CheckIcon className="w-2.5 h-2.5" /> Booked</span>}
                          </div>
                          <div className="flex items-end justify-between gap-4">
                            <p className="text-xs text-slate-600 line-clamp-2 flex-1 leading-relaxed">{act.description}</p>
                            <div className="p-2 bg-rose-50 rounded-full group-hover:bg-rose-100 transition-colors">
                              <MapIcon className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                          </div>
                      </div>
                   </div>
                 );
               })}
             </div>
           </div>
       </main>

       {/* Floating Quick Action Bar */}
       <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-50">
          <div className="max-w-3xl mx-auto flex justify-center pointer-events-auto">
             <div className="bg-white/95 backdrop-blur-xl border border-rose-100 shadow-2xl rounded-[2.5rem] p-2 flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[95vw]">
               {[ 
                 {t:'sightseeing', l:'Place', i:<CameraIcon className="w-5 h-5" />, c:'blue'}, 
                 {t:'food', l:'Food', i:<CoffeeIcon className="w-5 h-5" />, c:'orange'}, 
                 {t:'stay', l:'Stay', i:<BedIcon className="w-5 h-5" />, c:'emerald'}, 
                 {t:'shopping', l:'Shop', i:<ShoppingBagIcon className="w-5 h-5" />, c:'rose'} ,
                 {t:'travel', l:'Travel', i:<PlaneIcon className="w-5 h-5" />, c:'sky'},
                 {t:'drive', l:'Drive', i:<CarIcon className="w-5 h-5" />, c:'indigo'}
               ].map(btn => (
                 <button key={btn.t} onClick={() => { setEditingActivity(null); setAddingType(btn.t as ActivityType); setIsActivityModalOpen(true); }} className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 group min-w-[3.5rem] sm:min-w-[4rem]">
                    <div className={`w-10 h-10 rounded-2xl bg-${btn.c}-50 text-${btn.c}-500 flex items-center justify-center mb-1 shadow-sm transition-all group-active:scale-90 group-hover:scale-105`}>{btn.i}</div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">{btn.l}</span>
                 </button>
               ))}
               <div className="w-px h-8 bg-rose-100 mx-1"></div>
               <button onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }} className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 group min-w-[3.5rem] sm:min-w-[4rem]">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-1 shadow-lg group-active:scale-90 group-hover:scale-105 transition-all"><PlusIcon className="w-5 h-5" /></div>
                  <span className="text-[8px] font-bold text-rose-500 uppercase">Custom</span>
               </button>
             </div>
          </div>
       </div>

       <ActivityModal isOpen={isActivityModalOpen} onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); setAddingType(undefined); }} onSave={handleSaveActivity} initialData={editingActivity} initialType={addingType} exchangeRate={exchangeRate} />
       <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} trip={trip} exchangeRate={exchangeRate} />
       <SubwayMapModal isOpen={isMetroGuideOpen} onClose={() => setIsMetroGuideOpen(false)} />
       <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentTrip={trip} />
    </div>
  );
};

export default App;
