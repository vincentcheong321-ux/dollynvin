
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Activity, ActivityType, DailyPlan } from './types';
import { createBlankTrip } from './services/presetTrip';
import { supabase } from './lib/supabase';
import { GoogleGenAI } from "@google/genai";
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
  PlaneIcon,
  MapIcon,
  CoffeeIcon,
  CameraIcon,
  BedIcon,
  SparklesIcon,
  ArrowRightIcon,
  HomeIcon,
  CalendarIcon,
  HeartIcon
} from './components/Icons';

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
    customMapLink: '', type: 'sightseeing', cost: 0, notes: '', isBooked: false,
    flightNo: '', terminal: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...initialData, 
        cost: initialData.cost ?? 0,
        flightNo: initialData.flightNo ?? '',
        terminal: initialData.terminal ?? '',
        customMapLink: initialData.customMapLink ?? '',
        notes: initialData.notes ?? ''
      });
    } else {
      setFormData({
        id: generateId(), time: '09:00', title: '', description: '', location: '',
        customMapLink: '', type: initialType || 'sightseeing', cost: 0, notes: '', isBooked: false,
        flightNo: '', terminal: ''
      });
    }
  }, [initialData, isOpen, initialType]);

  if (!isOpen) return null;

  const myrEquivalent = (formData.cost || 0) * exchangeRate;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
  const categoryTotals: Record<string, number> = { food: 0, sightseeing: 0, relaxation: 0, travel: 0, stay: 0, shopping: 0, other: 0 };
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
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${(cost / maxCost) * 100}%` }}></div>
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

// --- Metro Station Assistant Modal ---
const MetroGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [stationName, setStationName] = useState('');
  const [guide, setGuide] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchGuide = async (nameOverride?: string) => {
    const target = nameOverride || stationName;
    if (!target.trim()) return;
    setIsLoading(true);
    setGuide('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a detailed platform navigation guide for ${target} station in Japan. Explain how to find the major platforms (like JR Yamanote line, Shinkansen, or local metro lines) from main entrances. Include tips for navigating complex exits. Keep it helpful for a tourist.`,
        config: {
          systemInstruction: "You are a Japanese transport expert. Provide clear, concise wayfinding instructions for railway stations."
        }
      });
      setGuide(response.text || "Sorry, I couldn't find details for that station.");
    } catch (err) {
      console.error('Metro Guide Error:', err);
      setGuide("An error occurred while fetching the guide. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (name: string) => {
    setStationName(name);
    fetchGuide(name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl z-10 p-8 flex flex-col max-h-[85vh] animate-slideUp overflow-hidden border border-rose-100 text-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-3 bg-rose-50 rounded-2xl"><MapIcon className="w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-rose-950">Metro Assistant</h3>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Platform Navigator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="mb-6 flex gap-2">
          <input type="text" placeholder="Enter station name..." value={stationName} onChange={(e) => setStationName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchGuide()} className="flex-1 p-4 bg-rose-50 border border-rose-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 transition-all font-medium text-rose-900" />
          <button onClick={() => fetchGuide()} disabled={isLoading || !stationName.trim()} className="p-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[3.5rem]">
            {isLoading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <ArrowRightIcon className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-6">
          {!guide && !isLoading && (
            <div className="text-center py-6">
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Quick Select</p>
               <div className="flex flex-wrap justify-center gap-2">
                 {['Shinjuku', 'Tokyo', 'Shibuya', 'Kyoto', 'Osaka'].map(s => (
                   <button key={s} onClick={() => handleQuickSelect(s)} className="px-4 py-2 bg-white border border-rose-100 rounded-full text-xs font-bold text-rose-400 hover:bg-rose-50 transition-colors shadow-sm">{s}</button>
                 ))}
               </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <SparklesIcon className="w-8 h-8 text-rose-400 animate-pulse" />
              <p className="text-rose-400 font-serif italic animate-pulse text-center">Checking the station maps...</p>
            </div>
          ) : guide && (
            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 leading-relaxed animate-fadeIn whitespace-pre-wrap">
               <h4 className="font-serif font-bold text-xl text-rose-950 mb-4 border-b border-rose-100 pb-2">Wayfinding for {stationName}</h4>
               {guide}
            </div>
          )}
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
    const saveTrip = async () => {
      await supabase.from('trips').upsert({ id: 'our-trip-id', data: trip });
    };
    const timer = setTimeout(saveTrip, 1000);
    return () => clearTimeout(timer);
  }, [trip, isLoading]);

  const currentDayPlan = useMemo(() => trip?.dailyPlans.find(d => d.dayNumber === activeDay), [trip, activeDay]);
  const sortedActivities = useMemo(() => currentDayPlan ? [...currentDayPlan.activities].sort((a, b) => a.time.localeCompare(b.time)) : [], [currentDayPlan]);
  
  // Calculate Total Trip Stats
  const totalBudgetJPY = useMemo(() => {
    if (!trip) return 0;
    return trip.dailyPlans.reduce((sum, plan) => 
      sum + plan.activities.reduce((s, a) => s + (a.cost ?? 0), 0)
    , 0);
  }, [trip]);
  
  const dayTotalJPY = useMemo(() => sortedActivities.reduce((sum, act) => sum + (act.cost ?? 0), 0), [sortedActivities]);
  const dayTotalMYR = dayTotalJPY * exchangeRate;
  const isSelectedDayToday = useMemo(() => isToday(trip?.startDate, activeDay), [trip?.startDate, activeDay]);

  if (!trip || isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-rose-400 animate-pulse text-xl">Creating our map...</div>;

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

  const resetTrip = () => {
    if (confirm('Reset everything? This cannot be undone.')) {
      handleUpdate(createBlankTrip());
      setActiveDay(1);
      setView('dashboard');
      setIsNotesOpen(false);
    }
  };

  // DASHBOARD VIEW
  if (view === 'dashboard') {
    const daysUntil = getDaysUntil(trip.startDate);
    return (
      <div className="min-h-screen flex flex-col sakura-bg animate-fadeIn">
        <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-rose-100 p-4">
           <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <HeartIcon className="w-5 h-5 text-rose-500" />
                 <h1 className="text-xl font-serif font-bold text-rose-950">Our Journey</h1>
              </div>
              <button onClick={() => setIsNotesOpen(!isNotesOpen)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full"><NoteIcon className="w-5 h-5" /></button>
           </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-8 pb-32">
           <section className="text-center py-10 space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border border-rose-100">
                   <HeartIcon className="w-10 h-10 text-rose-500" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-4xl font-serif font-bold text-slate-800">{trip.destination}</h2>
                <p className="text-rose-400 font-bold tracking-widest uppercase text-xs">Adventure for Two</p>
              </div>
              {daysUntil !== null && (
                <div className="bg-rose-50 inline-block px-6 py-2 rounded-full border border-rose-100 shadow-sm">
                   <span className="text-rose-600 font-bold text-sm">
                     {daysUntil > 0 ? `${daysUntil} Days To Go! ❤️` : daysUntil === 0 ? "It's Travel Day! ✈️" : "Memories made!"}
                   </span>
                </div>
              )}
           </section>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-rose-50 text-center space-y-2">
                 <CalendarIcon className="w-8 h-8 text-orange-400 mx-auto" />
                 <div>
                    <h4 className="font-bold text-slate-800 text-lg">{trip.duration} Days</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Trip Length</p>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-rose-50 text-center space-y-2">
                 <WalletIcon className="w-8 h-8 text-rose-400 mx-auto" />
                 <div>
                    <h4 className="font-bold text-slate-800 text-lg">¥{totalBudgetJPY.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Est. Total (RM {(totalBudgetJPY * exchangeRate).toFixed(0)})</p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-rose-50 p-8 space-y-6">
              <div className="flex items-center gap-3 text-rose-950 font-serif font-bold text-xl">
                 <SparklesIcon className="w-5 h-5 text-rose-400" />
                 <h3>Quick Actions</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => setView('itinerary')} className="w-full py-5 bg-rose-600 text-white rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-rose-700 transition-all shadow-lg active:scale-95">
                    <CalendarIcon className="w-5 h-5" /> Open Itinerary
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setIsMetroGuideOpen(true); }} className="py-4 bg-slate-900 text-white rounded-3xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-slate-800 transition-all active:scale-95">
                       <MapIcon className="w-4 h-4" /> Metro Guide
                    </button>
                    <button onClick={() => { setIsBudgetOpen(true); }} className="py-4 bg-white text-rose-600 border border-rose-100 rounded-3xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-rose-50 transition-all active:scale-95">
                       <WalletIcon className="w-4 h-4" /> Full Budget
                    </button>
                 </div>
              </div>
           </div>
        </main>

        {isNotesOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsNotesOpen(false)}></div>
             <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl z-10 animate-slideUp text-slate-800 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                   <h3 className="font-serif font-bold text-2xl text-rose-950">Trip Settings</h3>
                   <button onClick={() => setIsNotesOpen(false)}><CloseIcon className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="space-y-6">
                  <div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Trip Start Date</label><input type="date" className="w-full p-4 bg-rose-50 rounded-2xl outline-none" value={trip.startDate || ''} onChange={e => handleUpdate({...trip, startDate: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Exchange Rate (100 JPY to MYR)</label><div className="flex items-center gap-2 bg-rose-50 p-4 rounded-2xl"><input type="number" step="0.01" className="bg-transparent border-b border-rose-200 outline-none w-20 text-center font-bold" value={(exchangeRate * 100).toFixed(2)} onChange={e => setExchangeRate((parseFloat(e.target.value) || 0) / 100)} /><span className="text-xs font-bold">MYR</span></div></div>
                  <div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">General Notes</label><textarea className="w-full h-40 p-4 bg-rose-50 rounded-2xl outline-none resize-none" value={trip.notes} onChange={e => handleUpdate({...trip, notes: e.target.value})} /></div>
                  <button onClick={resetTrip} className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all">Reset Entire Trip</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // ITINERARY VIEW
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
                      <h2 className={`font-serif font-bold text-rose-950 truncate transition-all ${isScrolled ? 'text-sm' : 'text-base'}`}>{trip.destination}</h2>
                      {!isScrolled && <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{trip.duration} Day Trip</p>}
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-1">
                  <button onClick={() => setIsMetroGuideOpen(true)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full"><MapIcon className="w-5 h-5" /></button>
                  <button onClick={() => setIsBudgetOpen(true)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full"><WalletIcon className="w-5 h-5" /></button>
               </div>
            </div>
            <div className="flex gap-2 no-scrollbar overflow-x-auto pb-1 justify-center items-center">
               {trip.dailyPlans.map(p => (
                 <button key={p.id} onClick={() => { setActiveDay(p.dayNumber); setIsNotesOpen(false); }} className={`flex flex-col items-center justify-center rounded-2xl border transition-all ${isScrolled ? 'min-w-[2.8rem] py-1 px-1.5' : 'min-w-[3.2rem] py-1.5 px-2'} ${activeDay === p.dayNumber && !isNotesOpen ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-rose-100 text-rose-300'}`}>
                    <span className="text-[7px] font-bold uppercase opacity-70">Day {p.dayNumber}</span>
                    <span className="text-xs font-bold">{getDayOfMonth(trip.startDate, p.dayNumber - 1) || p.dayNumber}</span>
                 </button>
               ))}
               <button onClick={addDay} className="p-2 text-rose-200"><PlusIcon className="w-5 h-5" /></button>
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
                    <h2 className="text-xl font-serif font-bold text-rose-950 flex items-center gap-2 truncate">
                      <span className="text-rose-500">Day {activeDay}:</span> <span className="truncate">{currentDayPlan?.theme}</span> <EditIcon className="w-3 h-3 text-rose-200" />
                    </h2>
                  )}
                </div>
                <div className="text-right ml-4 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-100 flex-shrink-0 text-slate-800">
                   <div className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Est. Spend</div>
                   <div className="font-bold text-rose-950 text-sm">¥{dayTotalJPY.toLocaleString()}</div>
                   <div className="text-[9px] font-bold text-rose-400">≈ RM {dayTotalMYR.toFixed(2)}</div>
                </div>
             </div>

             <div className="relative border-l-2 border-rose-200/50 ml-4 sm:ml-6 space-y-6 pb-4 pl-6 sm:pl-10 text-slate-800">
               {sortedActivities.length === 0 && <div className="py-24 text-center border-2 border-dashed border-rose-100 rounded-[3rem] text-rose-300 italic ml-[-2rem]">Empty schedule for today.</div>}
               {sortedActivities.map((act, idx) => {
                 const ongoing = isSelectedDayToday && isActivityOngoing(act.time, sortedActivities[idx+1]?.time);
                 return (
                   <div key={act.id} className="relative group">
                      <div className={`absolute -left-[33px] sm:-left-[49px] top-6 w-4 h-4 rounded-full border-2 bg-white z-10 transition-all ${ongoing ? 'border-rose-500 ring-8 ring-rose-100 scale-125' : (act.isBooked ? 'border-green-500' : 'border-rose-300')}`}></div>
                      
                      {ongoing && <div className="absolute -left-5 -top-1.5 text-[8px] font-black text-white uppercase tracking-tighter bg-rose-600 px-1.5 py-0.5 rounded shadow-sm animate-pulse z-20">Ongoing</div>}
                      
                      <div onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className={`group bg-white/95 backdrop-blur-sm p-4 rounded-[2rem] shadow-sm border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${ongoing ? 'border-rose-300 ring-2 ring-rose-50 bg-rose-50/10' : (act.isBooked ? 'border-l-8 border-l-green-400 border-y-white border-r-white' : 'border-white hover:border-rose-100')}`}>
                          <div className="flex justify-between items-start mb-2 gap-2 text-slate-800">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-xl flex-shrink-0 ${ongoing ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'}`}>{act.time}</span>
                              <h4 className="font-bold text-sm truncate">{act.title}</h4>
                            </div>
                            <button onClick={e => { e.stopPropagation(); handleDeleteActivity(act.id); }} className="p-1 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><TrashIcon className="w-3.5 h-3.5" /></button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mb-3">
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                               <ActivityIcon type={act.type} className="w-3 h-3 text-slate-500" />
                               <span className="uppercase font-bold tracking-widest">{act.type}</span>
                            </div>
                            {(act.cost ?? 0) > 0 && <span className="text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">¥{(act.cost ?? 0).toLocaleString()}</span>}
                            {act.isBooked && <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-lg border border-green-100 flex items-center gap-1"><CheckIcon className="w-2.5 h-2.5" /> Booked</span>}
                          </div>
                          
                          <div className="flex items-end justify-between gap-4">
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed flex-1">{act.description}</p>
                            {(act.customMapLink || act.location) && (
                              <a href={act.customMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-2.5 bg-rose-50 text-rose-400 rounded-2xl border border-rose-100 flex-shrink-0 hover:bg-rose-100 transition-colors">
                                <MapIcon className="w-4 h-4" />
                              </a>
                            )}
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
                 {t:'travel', l:'Transit', i:<PlaneIcon className="w-5 h-5" />, c:'sky'} 
               ].map(btn => (
                 <button key={btn.t} onClick={() => { setEditingActivity(null); setAddingType(btn.t as ActivityType); setIsActivityModalOpen(true); }} className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 group min-w-[3.5rem] sm:min-w-[4rem]">
                    <div className={`w-9 h-9 rounded-2xl bg-${btn.c}-50 text-${btn.c}-500 flex items-center justify-center mb-1 shadow-sm border border-${btn.c}-50 transition-transform group-active:scale-90`}>{btn.i}</div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">{btn.l}</span>
                 </button>
               ))}
               <div className="w-px h-8 bg-rose-100 mx-1"></div>
               <button onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }} className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 group min-w-[3.5rem] sm:min-w-[4rem]">
                  <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-1 shadow-lg group-active:scale-90"><PlusIcon className="w-5 h-5" /></div>
                  <span className="text-[8px] font-bold text-rose-500 uppercase">Custom</span>
               </button>
             </div>
          </div>
       </div>

       <ActivityModal isOpen={isActivityModalOpen} onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); setAddingType(undefined); }} onSave={handleSaveActivity} initialData={editingActivity} initialType={addingType} exchangeRate={exchangeRate} />
       <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} trip={trip} exchangeRate={exchangeRate} />
       <MetroGuideModal isOpen={isMetroGuideOpen} onClose={() => setIsMetroGuideOpen(false)} />
    </div>
  );
};

export default App;
