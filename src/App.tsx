
import React, { useState, useEffect } from 'react';
import { Trip, Activity, ActivityType, DailyPlan } from './types';
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
  BackIcon,
  PlaneIcon,
  MapIcon,
  CoffeeIcon,
  CameraIcon,
  ShoppingBagIcon,
  BedIcon
} from './components/Icons';

// --- Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getFormattedDate = (startDate: string | undefined, dayOffset: number) => {
  if (!startDate) return `DAY ${dayOffset + 1}`;
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  // Returns format like "FRI, APR 25"
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
};

// --- Activity Modal ---
interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  initialData?: Activity | null;
  initialType?: ActivityType;
  exchangeRate: number; // Rate for 1 JPY to MYR
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
        customMapLink: initialData.customMapLink ?? ''
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl z-10 p-6 sm:p-8 animate-fadeIn flex flex-col max-h-[90vh] border border-slate-100">
        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold text-slate-800">{initialData ? 'Edit Activity' : 'Add Activity'}</h3>
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

          {formData.type === 'travel' && (
            <div className="grid grid-cols-2 gap-4 animate-fadeIn p-4 bg-sky-50 rounded-2xl border border-sky-100">
              <div>
                <label className="block text-xs font-bold text-sky-600 uppercase mb-1.5 flex items-center gap-1">
                  <PlaneIcon className="w-3 h-3" /> Flight No
                </label>
                <input type="text" placeholder="e.g. MH123" value={formData.flightNo || ''} onChange={e => setFormData({...formData, flightNo: e.target.value})} className="w-full p-3 bg-white border border-sky-100 rounded-xl outline-none font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-600 uppercase mb-1.5">Terminal</label>
                <input type="text" placeholder="e.g. T1" value={formData.terminal || ''} onChange={e => setFormData({...formData, terminal: e.target.value})} className="w-full p-3 bg-white border border-sky-100 rounded-xl outline-none font-medium" />
              </div>
            </div>
          )}

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
          <button onClick={() => onSave(formData)} disabled={!formData.title} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2">
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-md transition-opacity" onClick={onClose}></div>
       <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl z-10 p-8 flex flex-col max-h-[85vh] animate-slideUp">
         <div className="flex justify-between items-center mb-8">
           <div className="flex items-center space-x-3 text-rose-600">
             <WalletIcon className="w-6 h-6" />
             <h3 className="text-2xl font-serif font-bold text-rose-950">Budget Summary</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full"><CloseIcon className="w-6 h-6" /></button>
         </div>
         <div className="overflow-y-auto pr-2 space-y-8 flex-1 no-scrollbar">
            <div className="bg-rose-600 rounded-2xl p-8 text-white text-center shadow-lg">
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
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(cost / maxCost) * 100}%` }}></div>
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

// --- Main App ---
const App = () => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [addingType, setAddingType] = useState<ActivityType | undefined>(undefined);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTheme, setEditingTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0.03); // 1 JPY = 0.03 MYR approx

  // Load from Supabase on start
  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('trips').select('data').eq('id', 'our-trip-id').single();
      if (data && !error) {
        setTrip(data.data);
      } else {
        const blank = createBlankTrip();
        setTrip(blank);
      }
      setIsLoading(false);
    };
    loadTrip();
  }, []);

  // Save to Supabase on changes
  useEffect(() => {
    if (!trip || isLoading) return;
    const saveTrip = async () => {
      await supabase.from('trips').upsert({ id: 'our-trip-id', data: trip });
    };
    const timer = setTimeout(saveTrip, 1000);
    return () => clearTimeout(timer);
  }, [trip, isLoading]);

  if (!trip || isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-rose-400 animate-pulse">Loading Our Journey...</div>;

  const handleUpdate = (t: Trip) => setTrip({ ...t });
  
  const currentDayPlan = trip.dailyPlans.find(d => d.dayNumber === activeDay);
  const sortedActivities = currentDayPlan ? [...currentDayPlan.activities].sort((a, b) => a.time.localeCompare(b.time)) : [];
  const dayTotalJPY = sortedActivities.reduce((sum, act) => sum + (act.cost ?? 0), 0);
  const dayTotalMYR = dayTotalJPY * exchangeRate;

  const handleSaveActivity = (activity: Activity) => {
    const updatedPlans = trip.dailyPlans.map(plan => {
      if (plan.dayNumber === activeDay) {
        const activities = editingActivity 
          ? plan.activities.map(a => a.id === activity.id ? activity : a)
          : [...plan.activities, activity];
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
    if (confirm('Reset everything and start over?')) {
      handleUpdate(createBlankTrip());
      setActiveDay(1);
    }
  };

  const openAddModal = (type: ActivityType = 'sightseeing') => {
    setEditingActivity(null);
    setAddingType(type);
    setIsActivityModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col sakura-bg">
       <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-rose-100 shadow-sm">
         <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={resetTrip} className="p-2 text-rose-300 hover:text-rose-500" title="Reset Trip"><BackIcon className="w-5 h-5" /></button>
            <div className="flex-1 text-center cursor-pointer" onClick={() => setEditingTitle(true)}>
              {editingTitle ? (
                <input autoFocus className="text-center font-serif font-bold text-lg outline-none w-full border-b-2 border-rose-200 bg-transparent" defaultValue={trip.destination} onBlur={e => { handleUpdate({...trip, destination: e.target.value}); setEditingTitle(false); }} />
              ) : (
                <div className="flex flex-col items-center">
                   <h2 className="font-serif font-bold text-rose-950 text-xl flex items-center gap-2">{trip.destination} <EditIcon className="w-3 h-3 text-rose-200" /></h2>
                   <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{trip.duration} Days Journey</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
               <button onClick={() => setIsBudgetOpen(true)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><WalletIcon className="w-5 h-5" /></button>
               <button onClick={() => setIsNotesOpen(!isNotesOpen)} className={`p-2 rounded-full transition-colors ${isNotesOpen ? 'bg-rose-100 text-rose-600' : 'text-rose-400 hover:bg-rose-50'}`}><NoteIcon className="w-5 h-5" /></button>
            </div>
         </div>
         <div className="w-full bg-white/50 py-3 px-4 flex flex-wrap justify-center gap-2 border-t border-rose-50 no-scrollbar overflow-x-auto">
            {trip.dailyPlans.map(p => (
              <button key={p.id} onClick={() => { setActiveDay(p.dayNumber); setIsNotesOpen(false); }} className={`min-w-[3.5rem] py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${activeDay === p.dayNumber && !isNotesOpen ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-rose-100 text-rose-300'}`}>
                Day {p.dayNumber}
              </button>
            ))}
            <button onClick={addDay} className="p-2 text-rose-200 hover:text-rose-500"><PlusIcon className="w-5 h-5" /></button>
         </div>
       </header>

       <main className="flex-1 max-w-3xl mx-auto w-full p-4 pb-32">
         {isNotesOpen ? (
           <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-rose-50 space-y-6 animate-fadeIn">
              <h3 className="font-serif font-bold text-2xl text-rose-950 border-b border-rose-50 pb-4">General Trip Notes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-rose-400 uppercase mb-2">Trip Start Date</label>
                  <input type="date" className="w-full p-3 bg-rose-50 border-none rounded-xl outline-none" value={trip.startDate || ''} onChange={e => handleUpdate({...trip, startDate: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-rose-400 uppercase mb-2">Exchange Rate (MYR per 100 JPY)</label>
                    <div className="flex items-center space-x-2 bg-rose-50 p-3 rounded-xl">
                      <span className="text-xs font-bold text-rose-900">100 JPY =</span>
                      <input type="number" step="0.01" className="bg-transparent border-b border-rose-200 outline-none w-20 text-center font-bold text-rose-900" value={(exchangeRate * 100).toFixed(2)} onChange={e => setExchangeRate((parseFloat(e.target.value) || 0) / 100)} />
                      <span className="text-xs font-bold text-rose-900">MYR</span>
                    </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-400 uppercase mb-2">Private Notes</label>
                <textarea className="w-full h-64 p-4 bg-rose-50 rounded-2xl outline-none resize-none" placeholder="Flight details, hotel confirmations, addresses..." value={trip.notes} onChange={e => handleUpdate({...trip, notes: e.target.value})} />
              </div>
           </div>
         ) : (
           <div className="space-y-6 animate-fadeIn">
             <div className="flex items-center justify-between p-2">
                <div onClick={() => setEditingTheme(true)} className="cursor-pointer group">
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mb-1 drop-shadow-sm">
                    {getFormattedDate(trip.startDate, activeDay - 1)}
                  </div>
                  {editingTheme ? (
                    <input autoFocus className="text-2xl font-serif font-bold text-rose-950 border-b border-rose-100 outline-none bg-transparent" defaultValue={currentDayPlan?.theme} onBlur={e => {
                      const updated = trip.dailyPlans.map(p => p.dayNumber === activeDay ? {...p, theme: e.target.value} : p);
                      handleUpdate({...trip, dailyPlans: updated});
                      setEditingTheme(false);
                    }} />
                  ) : (
                    <h2 className="text-2xl font-serif font-bold text-rose-950 flex items-center gap-2">
                      <span className="text-rose-500 mr-2">Day {activeDay}:</span>
                      {currentDayPlan?.theme} 
                      <EditIcon className="w-3 h-3 text-rose-200" />
                    </h2>
                  )}
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Day Est.</div>
                   <div className="font-bold text-rose-900 text-xl">¥{dayTotalJPY.toLocaleString()}</div>
                   <div className="text-[10px] font-bold text-rose-300">≈ RM {dayTotalMYR.toFixed(2)}</div>
                </div>
             </div>

             <div className="space-y-4">
               {sortedActivities.length === 0 && (
                 <div className="py-24 text-center border-2 border-dashed border-rose-100 rounded-[3rem] text-rose-300 italic">No plans for this day yet.</div>
               )}
               {sortedActivities.map(act => (
                 <div key={act.id} onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className={`group bg-white/95 backdrop-blur-sm p-5 rounded-3xl shadow-sm border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${act.isBooked ? 'border-l-4 border-l-green-400' : 'border-rose-50'}`}>
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">{act.time}</span>
                         <h4 className="font-bold text-lg text-slate-800">{act.title}</h4>
                       </div>
                       <div className="flex items-center gap-2">
                         { (act.customMapLink || act.location) && (
                           <a 
                             href={act.customMapLink && act.customMapLink.trim() !== "" ? (act.customMapLink.startsWith('http') ? act.customMapLink : `https://${act.customMapLink}`) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`} 
                             target="_blank" 
                             rel="noreferrer" 
                             onClick={e => e.stopPropagation()} 
                             className="p-2 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-full border border-rose-100"
                           >
                             <MapIcon className="w-3 h-3" />
                           </a>
                         )}
                         <button onClick={e => { e.stopPropagation(); handleDeleteActivity(act.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-400 transition-all"><TrashIcon className="w-3 h-3" /></button>
                       </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-2">
                       <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                         <ActivityIcon type={act.type} className="w-3 h-3" />
                         <span className="uppercase font-bold tracking-widest">{act.type}</span>
                       </div>
                       {act.flightNo && (
                         <div className="flex items-center gap-1 bg-sky-50 text-sky-600 px-2 py-0.5 rounded border border-sky-100 font-bold">
                            <PlaneIcon className="w-3 h-3" />
                            <span>FLIGHT: {act.flightNo}</span>
                            {act.terminal && <span className="ml-1 opacity-70">({act.terminal})</span>}
                         </div>
                       )}
                       {(act.cost ?? 0) > 0 && (
                         <span className="text-rose-400 font-bold">
                           ¥{(act.cost ?? 0).toLocaleString()}
                           <span className="ml-1 opacity-60 text-[10px]">≈ RM {((act.cost ?? 0) * exchangeRate).toFixed(2)}</span>
                         </span>
                       )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{act.description}</p>
                 </div>
               ))}
             </div>
           </div>
         )}
       </main>

       {/* Floating Quick Add Bottom Bar */}
       {!isNotesOpen && (
         <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-50">
            <div className="max-w-3xl mx-auto flex justify-center pointer-events-auto">
               <div className="bg-white/90 backdrop-blur-xl border border-rose-100 shadow-xl rounded-2xl p-2 flex items-center space-x-1 sm:space-x-2">
                 <button onClick={() => openAddModal('sightseeing')} title="Add Place" className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors"><CameraIcon className="w-5 h-5" /></button>
                 <button onClick={() => openAddModal('food')} title="Add Food" className="p-3 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-100 transition-colors"><CoffeeIcon className="w-5 h-5" /></button>
                 <button onClick={() => openAddModal('shopping')} title="Add Shopping" className="p-3 bg-purple-50 text-purple-500 rounded-xl hover:bg-purple-100 transition-colors"><ShoppingBagIcon className="w-5 h-5" /></button>
                 <button onClick={() => openAddModal('stay')} title="Add Stay" className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-100 transition-colors"><BedIcon className="w-5 h-5" /></button>
                 <button onClick={() => openAddModal('travel')} title="Add Transit" className="p-3 bg-sky-50 text-sky-500 rounded-xl hover:bg-sky-100 transition-colors"><PlaneIcon className="w-5 h-5" /></button>
                 <div className="w-px h-8 bg-slate-200 mx-1"></div>
                 <button onClick={() => openAddModal('other')} title="Add Custom" className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-lg"><PlusIcon className="w-5 h-5" /></button>
               </div>
            </div>
         </div>
       )}

       <ActivityModal 
         isOpen={isActivityModalOpen} 
         onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); setAddingType(undefined); }} 
         onSave={handleSaveActivity} 
         initialData={editingActivity} 
         initialType={addingType}
         exchangeRate={exchangeRate}
       />
       <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} trip={trip} exchangeRate={exchangeRate} />
    </div>
  );
};

export default App;
