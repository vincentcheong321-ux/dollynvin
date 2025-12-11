import React, { useState, useEffect, useRef } from 'react';
import { Trip, ChatMessage, Activity, ActivityType, DailyPlan } from './types';
import { sendChatMessage } from './services/geminiService';
import { getPresetJapanTrip } from './services/presetTrip';
import { 
  MapPinIcon, 
  CalendarIcon, 
  ActivityIcon,
  ChatIcon,
  BackIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  CheckIcon,
  NoteIcon,
  CloseIcon,
  BedIcon,
  CoffeeIcon,
  CameraIcon,
  PlaneIcon,
  MapIcon,
  WalletIcon,
  PieChartIcon,
  ShoppingBagIcon
} from './components/Icons';

// --- Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getFormattedDate = (startDate: string | undefined, dayOffset: number) => {
  if (!startDate) return `Day ${dayOffset + 1}`;
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' });
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
    id: '',
    time: '09:00',
    title: '',
    description: '',
    location: '',
    customMapLink: '',
    type: 'sightseeing',
    cost: 0,
    notes: '',
    isBooked: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure cost is a number when editing, handling legacy data
        cost: typeof initialData.cost === 'number' ? initialData.cost : 0
      });
    } else {
      setFormData({
        id: generateId(),
        time: '09:00',
        title: '',
        description: '',
        location: '',
        customMapLink: '',
        type: initialType || 'sightseeing',
        cost: 0,
        notes: '',
        isBooked: false
      });
    }
  }, [initialData, isOpen, initialType]);

  if (!isOpen) return null;

  const safeRate = isNaN(exchangeRate) ? 0 : exchangeRate;
  const safeCost = formData.cost && !isNaN(formData.cost) ? formData.cost : 0;
  const myrCost = (safeCost * safeRate).toFixed(2);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl z-10 p-6 sm:p-8 animate-fadeIn flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-shrink-0 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold text-slate-800">
              {initialData ? 'Edit Activity' : 'Add to Itinerary'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
               {formData.title || 'New Plan'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Row 1: Time, Type, Status */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 sm:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Time</label>
              <input 
                type="time" 
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none font-medium text-slate-700"
              />
            </div>
            <div className="col-span-7 sm:col-span-5">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
              <div className="relative">
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ActivityType})}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none appearance-none text-slate-700 font-medium"
                >
                  <option value="food">Food & Dining</option>
                  <option value="sightseeing">Sightseeing</option>
                  <option value="shopping">Shopping</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="travel">Transit/Flight</option>
                  <option value="stay">Hotel/Stay</option>
                  <option value="other">Other Activity</option>
                </select>
                <div className="absolute left-3 top-3.5 pointer-events-none text-slate-400">
                  <ActivityIcon type={formData.type} className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="col-span-12 sm:col-span-4 flex items-end pb-1">
              <label className="flex items-center space-x-3 cursor-pointer w-full p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isBooked ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}>
                  {formData.isBooked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <input type="checkbox" checked={formData.isBooked || false} onChange={e => setFormData({...formData, isBooked: e.target.checked})} className="hidden" />
                <span className={`text-sm font-bold ${formData.isBooked ? 'text-green-700' : 'text-slate-500'}`}>
                  {formData.isBooked ? 'Booked!' : 'Mark as Booked'}
                </span>
              </label>
            </div>
          </div>

          {/* Row 2: Title & Location */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">What are we doing?</label>
              <input 
                type="text" 
                placeholder="e.g., Dinner at La Tour Eiffel"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-lg font-medium placeholder-slate-400 text-slate-800"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location Name</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Address or Place Name"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Google Maps Link (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.customMapLink || ''}
                  onChange={e => setFormData({...formData, customMapLink: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Description & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notes / Description</label>
                <textarea 
                  rows={4}
                  placeholder="Details about the activity..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none resize-none text-slate-700"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cost (JPY)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">¥</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={formData.cost === undefined ? '' : formData.cost}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setFormData({...formData, cost: isNaN(val) ? 0 : val});
                    }}
                    className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none font-medium text-slate-700"
                  />
                  <div className="absolute -bottom-6 right-0 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                    ≈ RM {isNaN(parseFloat(myrCost)) ? '0.00' : myrCost}
                  </div>
                </div>
             </div>
          </div>

          {/* Row 4: Important Data */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-4">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <NoteIcon className="w-4 h-4" />
              <label className="text-xs font-bold uppercase">Important Details</label>
            </div>
            <textarea 
              rows={3}
              placeholder="Paste Booking IDs, Flight Numbers, Reservation Links here..."
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none resize-none text-slate-700 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <div className="mt-6 flex-shrink-0 pt-4 border-t border-slate-100">
          <button 
            onClick={() => onSave(formData)}
            disabled={!formData.title}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 transform active:scale-[0.99]"
          >
            <SaveIcon className="w-5 h-5" />
            <span>Save Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Budget Modal ---
const BudgetModal = ({ 
  isOpen, 
  onClose, 
  trip, 
  exchangeRate 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  trip: Trip, 
  exchangeRate: number 
}) => {
  if (!isOpen) return null;

  // Safe Exchange Rate
  const safeRate = isNaN(exchangeRate) ? 0 : exchangeRate;

  // Calculations
  let totalJPY = 0;
  const categoryTotals: Record<string, number> = {
    food: 0, sightseeing: 0, relaxation: 0, travel: 0, stay: 0, shopping: 0, other: 0
  };
  const dayTotals: { day: number, cost: number }[] = [];

  trip.dailyPlans.forEach(plan => {
    let dTotal = 0;
    plan.activities.forEach(act => {
      // Ensure cost is a number. If undefined or NaN, treat as 0.
      const c = (act.cost && !isNaN(act.cost)) ? act.cost : 0;
      totalJPY += c;
      dTotal += c;
      if (categoryTotals[act.type] !== undefined) {
        categoryTotals[act.type] += c;
      } else {
        categoryTotals['other'] += c;
      }
    });
    dayTotals.push({ day: plan.dayNumber, cost: dTotal });
  });

  const totalMYR = totalJPY * safeRate;
  const maxCategoryCost = Math.max(...Object.values(categoryTotals), 1); // Avoid div by zero

  const formatMoney = (amount: number) => {
    return isNaN(amount) ? "0.00" : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-md transition-opacity" onClick={onClose}></div>
       <div className="bg-white/95 w-full max-w-2xl rounded-3xl shadow-2xl z-10 p-6 sm:p-8 flex flex-col max-h-[90vh] animate-slideUp border border-white/50">
         <div className="flex justify-between items-center mb-6">
           <div className="flex items-center space-x-3 text-rose-600">
             <div className="p-2 bg-rose-100 rounded-full">
               <WalletIcon className="w-6 h-6" />
             </div>
             <h3 className="text-2xl font-serif font-bold text-rose-950">Trip Budget</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full text-rose-400">
             <CloseIcon className="w-6 h-6" />
           </button>
         </div>

         <div className="overflow-y-auto pr-2 space-y-8 flex-1 scrollbar-thin scrollbar-thumb-rose-200">
            {/* Hero Total */}
            <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-2xl p-6 text-white text-center shadow-lg shadow-rose-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <PieChartIcon className="w-32 h-32" />
               </div>
               <p className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2">Estimated Total Cost</p>
               <h2 className="text-4xl font-serif font-bold mb-2">¥ {totalJPY.toLocaleString()}</h2>
               <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-white/20">
                 ≈ RM {formatMoney(totalMYR)}
               </div>
            </div>

            {/* Breakdown by Category */}
            <div>
              <h4 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-400" />
                Category Breakdown
              </h4>
              <div className="space-y-3">
                {Object.entries(categoryTotals).map(([cat, cost]) => {
                   if (cost === 0) return null;
                   const pct = (cost / (totalJPY || 1)) * 100;
                   return (
                     <div key={cat}>
                       <div className="flex justify-between text-sm font-medium mb-1">
                         <div className="capitalize flex items-center gap-2 text-slate-700">
                            <ActivityIcon type={cat} className="w-3 h-3 text-slate-400" />
                            {cat === 'stay' ? 'Accommodation' : cat}
                         </div>
                         <div className="text-slate-500">
                           ¥{cost.toLocaleString()} <span className="text-xs text-rose-400 ml-1">({pct.toFixed(0)}%)</span>
                         </div>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${
                             cat === 'food' ? 'bg-orange-400' : 
                             cat === 'stay' ? 'bg-emerald-400' :
                             cat === 'travel' ? 'bg-sky-400' : 
                             cat === 'shopping' ? 'bg-purple-400' :
                             'bg-rose-400'
                           }`} 
                           style={{ width: `${(cost / maxCategoryCost) * 100}%` }}
                         ></div>
                       </div>
                     </div>
                   );
                })}
                {totalJPY === 0 && <p className="text-sm text-slate-400 italic">Add costs to activities to see the breakdown.</p>}
              </div>
            </div>

            {/* Breakdown by Day */}
            <div>
               <h4 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-rose-400" />
                  Daily Breakdown
               </h4>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dayTotals.map(d => (
                    <div key={d.day} className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 flex flex-col">
                       <span className="text-xs font-bold text-rose-400 uppercase">Day {d.day}</span>
                       <span className="font-bold text-rose-800">¥{d.cost.toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       </div>
    </div>
  );
};

// --- Trip Editor Component ---
const TripEditor = ({ 
  trip, 
  onUpdate, 
  onOpenChat 
}: { 
  trip: Trip, 
  onUpdate: (t: Trip) => void,
  onOpenChat: () => void
}) => {
  const [activeDay, setActiveDay] = useState(trip.dailyPlans[0]?.dayNumber || 1);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityTypeToAdd, setActivityTypeToAdd] = useState<ActivityType | undefined>(undefined);
  
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTheme, setEditingTheme] = useState(false); 
  const [exchangeRate, setExchangeRate] = useState(0.03);

  // Sorting
  const currentDayPlan = trip.dailyPlans.find(d => d.dayNumber === activeDay);
  const sortedActivities = currentDayPlan 
    ? [...currentDayPlan.activities].sort((a, b) => a.time.localeCompare(b.time))
    : [];

  // Stats Calculation
  const safeRate = isNaN(exchangeRate) ? 0 : exchangeRate;
  const dayTotalJPY = sortedActivities.reduce((sum, act) => sum + ((act.cost && !isNaN(act.cost)) ? act.cost : 0), 0);
  const dayTotalMYR = dayTotalJPY * safeRate;

  const handleSaveActivity = (activity: Activity) => {
    // Sanitize cost on save
    const sanitizedActivity = {
      ...activity,
      cost: (activity.cost && !isNaN(activity.cost)) ? activity.cost : 0
    };

    const updatedPlans = trip.dailyPlans.map(plan => {
      if (plan.dayNumber === activeDay) {
        if (editingActivity) {
          return {
            ...plan,
            activities: plan.activities.map(a => a.id === sanitizedActivity.id ? sanitizedActivity : a)
          };
        } else {
          return {
            ...plan,
            activities: [...plan.activities, sanitizedActivity]
          };
        }
      }
      return plan;
    });

    onUpdate({ ...trip, dailyPlans: updatedPlans });
    setIsActivityModalOpen(false);
    setEditingActivity(null);
    setActivityTypeToAdd(undefined);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!confirm('Remove this activity?')) return;
    const updatedPlans = trip.dailyPlans.map(plan => {
      if (plan.dayNumber === activeDay) {
        return {
          ...plan,
          activities: plan.activities.filter(a => a.id !== activityId)
        };
      }
      return plan;
    });
    onUpdate({ ...trip, dailyPlans: updatedPlans });
  };

  const updateTripNotes = (notes: string) => onUpdate({ ...trip, notes });
  const updateCoverImage = (url: string) => onUpdate({ ...trip, coverImage: url });
  
  const updateTripHeader = (title: string, dest: string, date: string) => {
      onUpdate({ ...trip, title, destination: dest, startDate: date });
      setEditingTitle(false);
  };

  const updateDayTheme = (newTheme: string) => {
    const updatedPlans = trip.dailyPlans.map(plan => {
      if (plan.dayNumber === activeDay) return { ...plan, theme: newTheme };
      return plan;
    });
    onUpdate({ ...trip, dailyPlans: updatedPlans });
    setEditingTheme(false);
  };

  const addDay = () => {
     const newDayNum = trip.dailyPlans.length + 1;
     const newDay: DailyPlan = {
         id: generateId(),
         dayNumber: newDayNum,
         activities: [],
         theme: 'Free Day'
     };
     onUpdate({ ...trip, duration: trip.duration + 1, dailyPlans: [...trip.dailyPlans, newDay]});
     setActiveDay(newDayNum);
  };

  const openAddModal = (type: ActivityType = 'sightseeing') => {
    setEditingActivity(null);
    setActivityTypeToAdd(type);
    setIsActivityModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
       {/* Sticky Header */}
       <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-rose-100/50">
         <div className="max-w-4xl mx-auto">
           {/* Top Bar: Back, Title, Actions */}
           <div className="px-4 py-3 flex items-center justify-between border-b border-rose-50/50">
             {/* Back Button Removed as per single trip design */}
             <div className="w-5"></div> 
             
             {/* Title */}
             <div className="flex-1 mx-4 text-center group cursor-pointer" onClick={() => setEditingTitle(true)}>
               {editingTitle ? (
                 <input 
                   className="text-center text-lg font-serif font-bold text-slate-800 border-b border-rose-300 outline-none w-full bg-transparent"
                   defaultValue={trip.destination}
                   onBlur={(e) => updateTripHeader(trip.title, e.target.value, trip.startDate || '')}
                   onKeyDown={(e) => { if(e.key === 'Enter') updateTripHeader(trip.title, e.currentTarget.value, trip.startDate || '') }}
                   autoFocus
                 />
               ) : (
                 <div className="flex flex-col items-center">
                    <h2 className="font-serif font-bold text-rose-950 text-lg flex items-center gap-2">
                        {trip.destination}
                        <EditIcon className="w-3 h-3 text-rose-300 opacity-0 group-hover:opacity-100" />
                    </h2>
                    <span className="text-xs text-rose-500 font-medium">
                      {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : 'Dates not set'}
                      {' '}- {trip.duration} Days
                    </span>
                 </div>
               )}
             </div>

             <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setIsBudgetOpen(true)}
                  className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors relative"
                  title="Trip Budget"
                >
                   <WalletIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsNotesOpen(!isNotesOpen)} 
                  className={`p-2 rounded-full transition-colors ${isNotesOpen ? 'bg-rose-100 text-rose-600' : 'text-rose-400 hover:bg-rose-50'}`}
                >
                  <NoteIcon className="w-5 h-5" />
                </button>
                <button onClick={onOpenChat} className="p-2 text-rose-600 hover:bg-rose-50 rounded-full relative transition-colors">
                  <ChatIcon className="w-5 h-5" />
                </button>
             </div>
           </div>
           
           {/* Day Navigator - Wrapping Layout */}
           <div className="w-full bg-white/50 backdrop-blur-sm py-3 px-4 flex flex-wrap justify-center gap-2 border-t border-rose-50">
              {trip.dailyPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => { setActiveDay(plan.dayNumber); setIsNotesOpen(false); }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] py-1.5 px-2 rounded-lg border transition-all ${
                    activeDay === plan.dayNumber && !isNotesOpen
                      ? 'bg-rose-900 border-rose-900 text-white shadow-md'
                      : 'bg-white border-rose-100 text-rose-900/60 hover:border-rose-300 hover:bg-white shadow-sm'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Day {plan.dayNumber}</span>
                  <span className="text-xs font-bold leading-none mt-0.5">
                    {trip.startDate 
                      ? new Date(new Date(trip.startDate).setDate(new Date(trip.startDate).getDate() + plan.dayNumber - 1)).getDate() 
                      : plan.dayNumber}
                  </span>
                </button>
              ))}
              <button 
                onClick={addDay} 
                className="flex-shrink-0 min-w-[2.5rem] py-2 rounded-lg border-2 border-dashed border-rose-200 text-rose-300 hover:border-rose-400 hover:text-rose-600 flex items-center justify-center transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
           </div>
         </div>
       </header>

       {/* Content Area */}
       <main className="flex-1 max-w-3xl mx-auto w-full p-4 pb-32">
         
         {isNotesOpen ? (
           <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white space-y-8 animate-fadeIn">
              <div className="flex items-center space-x-3 text-rose-600 border-b border-rose-50 pb-4">
                 <NoteIcon className="w-6 h-6" />
                 <h3 className="font-bold font-serif text-xl text-rose-950">Trip Info & Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Trip Start Date</label>
                    <input 
                       type="date"
                       className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
                       value={trip.startDate || ''}
                       onChange={(e) => updateTripHeader(trip.title, trip.destination, e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">JPY Exchange Rate</label>
                    <div className="flex items-center space-x-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                        <span className="text-sm font-bold text-rose-900">100 JPY ≈</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-20 bg-transparent border-b border-rose-300 focus:border-rose-500 outline-none text-center font-bold text-rose-900"
                          value={isNaN(exchangeRate) ? '' : (exchangeRate * 100).toFixed(2)}
                          onChange={(e) => {
                             const val = parseFloat(e.target.value);
                             if (!isNaN(val)) {
                               setExchangeRate(val / 100);
                             } else {
                               setExchangeRate(0);
                             }
                          }}
                        />
                        <span className="text-sm font-bold text-rose-900">MYR</span>
                    </div>
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Cover Image URL</label>
                    <input 
                       type="text"
                       placeholder="https://example.com/image.jpg"
                       className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
                       value={trip.coverImage || ''}
                       onChange={(e) => updateCoverImage(e.target.value)}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">General Notes</label>
                <textarea 
                  className="w-full h-40 p-4 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none resize-none text-slate-700"
                  placeholder="Flight info, hotel addresses, packing list..."
                  value={trip.notes || ''}
                  onChange={(e) => updateTripNotes(e.target.value)}
                />
              </div>
           </div>
         ) : (
           <div className="space-y-6 animate-fadeIn">
             
             {/* Daily Stats Summary */}
             <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                    {getFormattedDate(trip.startDate, (activeDay - 1))}
                  </div>
                   {editingTheme ? (
                      <input 
                        className="text-xl font-serif font-bold text-rose-950 border-b border-rose-300 outline-none bg-transparent"
                        defaultValue={currentDayPlan?.theme || `Day ${activeDay}`}
                        onBlur={(e) => updateDayTheme(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') updateDayTheme(e.currentTarget.value) }}
                        autoFocus
                      />
                    ) : (
                      <h2 
                        onClick={() => setEditingTheme(true)}
                        className="text-xl font-serif font-bold text-rose-950 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        {currentDayPlan?.theme || 'Set Theme'}
                        <EditIcon className="w-3 h-3 text-rose-300" />
                      </h2>
                    )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Est. Cost</div>
                  <div className="font-bold text-rose-950">¥{dayTotalJPY.toLocaleString()}</div>
                  <div className="text-xs font-bold text-rose-500">
                    ≈ RM{isNaN(dayTotalMYR) ? '0.00' : dayTotalMYR.toFixed(2)}
                  </div>
                </div>
             </div>

             {/* Activity List */}
             <div className="relative border-l-2 border-rose-200/50 ml-4 sm:ml-6 space-y-8 pb-4 pl-6 sm:pl-8">
               {sortedActivities.length === 0 && (
                 <div className="py-12 text-center">
                   <p className="text-rose-300 italic">No plans yet. Start by adding an activity below.</p>
                 </div>
               )}
               
               {sortedActivities.map((activity) => (
                 <div key={activity.id} className="relative group">
                   <div className={`absolute -left-[33px] sm:-left-[41px] top-6 w-4 h-4 rounded-full border-2 bg-white z-10 transition-colors ${activity.isBooked ? 'border-green-500' : 'border-rose-300'}`}></div>
                   
                   <div 
                     onClick={() => { setEditingActivity(activity); setIsActivityModalOpen(true); }}
                     className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-100 hover:-translate-y-0.5 duration-200 ${activity.isBooked ? 'border-l-4 border-l-green-500 border-y-white border-r-white' : 'border-white hover:border-rose-100'}`}
                   >
                     {/* Row 1: Time & Title */}
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">{activity.time}</span>
                         <h4 className={`font-bold text-lg ${activity.isBooked ? 'text-green-800' : 'text-slate-800'}`}>{activity.title}</h4>
                       </div>
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity.id); }} 
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                       </button>
                     </div>

                     {/* Row 2: Location & Type */}
                     <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                            activity.type === 'food' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            activity.type === 'sightseeing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            activity.type === 'shopping' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            activity.type === 'relaxation' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                            activity.type === 'stay' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            activity.type === 'travel' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                              <ActivityIcon type={activity.type} className="w-3 h-3 mr-1" />
                              {activity.type}
                        </span>
                        {typeof activity.cost === 'number' && (
                           <span className="text-xs font-medium text-slate-500">
                             ¥{activity.cost.toLocaleString()}
                           </span>
                        )}
                     </div>

                     {/* Row 3: Description & Map */}
                     <div className="flex items-end justify-between">
                        <div className="text-sm text-slate-600 leading-relaxed max-w-[80%]">
                           {activity.description && <p className="line-clamp-2">{activity.description}</p>}
                           {activity.notes && (
                             <div className="flex items-center gap-1 text-amber-500 mt-1 text-xs font-medium">
                               <NoteIcon className="w-3 h-3" />
                               <span className="truncate max-w-[200px]">{activity.notes}</span>
                             </div>
                           )}
                        </div>
                        {(activity.location || activity.customMapLink) && (
                           <a 
                             href={activity.customMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                             target="_blank"
                             rel="noreferrer"
                             onClick={(e) => e.stopPropagation()}
                             className="p-2 bg-rose-50 hover:bg-blue-50 text-rose-400 hover:text-blue-500 rounded-full transition-colors border border-rose-100"
                             title="View on Google Maps"
                           >
                              <MapIcon className="w-4 h-4" />
                           </a>
                        )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}
       </main>

       {/* Quick Add Bottom Bar */}
       {!isNotesOpen && (
         <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-rose-100 p-4 pb-6 z-30">
            <div className="max-w-3xl mx-auto flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
               <span className="text-xs font-bold text-rose-300 uppercase mr-2 hidden sm:inline">Quick Add:</span>
               <button onClick={() => openAddModal('sightseeing')} className="flex flex-col items-center p-2 rounded-xl hover:bg-rose-50 transition-colors group min-w-[4rem]">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
                    <CameraIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Place</span>
               </button>
               <button onClick={() => openAddModal('food')} className="flex flex-col items-center p-2 rounded-xl hover:bg-rose-50 transition-colors group min-w-[4rem]">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-orange-100">
                    <CoffeeIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Food</span>
               </button>
               <button onClick={() => openAddModal('shopping')} className="flex flex-col items-center p-2 rounded-xl hover:bg-rose-50 transition-colors group min-w-[4rem]">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-purple-100">
                    <ShoppingBagIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Shop</span>
               </button>
               <button onClick={() => openAddModal('stay')} className="flex flex-col items-center p-2 rounded-xl hover:bg-rose-50 transition-colors group min-w-[4rem]">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-emerald-100">
                    <BedIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Stay</span>
               </button>
               <button onClick={() => openAddModal('travel')} className="flex flex-col items-center p-2 rounded-xl hover:bg-rose-50 transition-colors group min-w-[4rem]">
                  <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-sky-100">
                    <PlaneIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Travel</span>
               </button>
               <div className="w-px h-8 bg-rose-200 mx-2"></div>
               <button onClick={() => openAddModal('other')} className="flex flex-col items-center p-2 rounded-xl hover:bg-rose-50 transition-colors group min-w-[4rem]">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-slate-200">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Custom</span>
               </button>
            </div>
         </div>
       )}

       {/* Modal */}
       <ActivityModal 
         isOpen={isActivityModalOpen} 
         onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); }}
         onSave={handleSaveActivity}
         initialData={editingActivity}
         initialType={activityTypeToAdd}
         exchangeRate={exchangeRate}
       />
       <BudgetModal 
          isOpen={isBudgetOpen}
          onClose={() => setIsBudgetOpen(false)}
          trip={trip}
          exchangeRate={exchangeRate}
       />
    </div>
  );
};

// --- Chat Assistant ---
const ChatAssistant = ({ isOpen, onClose, currentTrip }: { isOpen: boolean, onClose: () => void, currentTrip?: Trip }) => {
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
  }, [isOpen, currentTrip]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

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
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
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
                   <div className="mt-2 text-xs opacity-80 border-t border-white/20 pt-2 font-mono">
                     Sources found via Google
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
  // Always initialize with the preset trip
  const [trip, setTrip] = useState<Trip>(getPresetJapanTrip());
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
  };

  return (
    <>
      <TripEditor 
        trip={trip} 
        onUpdate={handleUpdateTrip}
        onOpenChat={() => setIsChatOpen(true)}
      />
      <ChatAssistant 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        currentTrip={trip}
      />
    </>
  );
};

export default App;