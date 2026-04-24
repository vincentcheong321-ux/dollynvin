import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trip, Activity, ActivityType, DailyPlan, ChatMessage, Document } from './types';
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
  HeartIcon,
  ShoppingBagIcon,
  PlaneIcon,
  CarIcon,
  BackIcon,
  PieChartIcon,
  FileIcon,
  UploadIcon,
  WeatherIcon
} from './components/Icons';
import { sendChatMessage } from './services/geminiService';
import { metroLines } from './data/metroData';

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

// --- Sakura Animation Component ---
const SakuraRain = ({ intensity = 30, isRamping = false }: { intensity?: number, isRamping?: boolean }) => {
  const petals = useMemo(() => Array.from({ length: intensity }).map((_, i) => ({
    id: i,
    left: Math.random() * 100 + '%',
    animationDelay: '-' + (Math.random() * 15) + 's',
    animationDuration: (isRamping ? 3 + Math.random() * 2 : 6 + Math.random() * 6) + 's',
    size: (8 + Math.random() * (isRamping ? 15 : 10)) + 'px',
    sway: (Math.random() * 40 - 20) + 'px'
  })), [intensity, isRamping]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{`
        @keyframes fall {
          0% { opacity: 0; transform: translateY(-10vh) rotate(0deg) translateX(0); }
          10% { opacity: 0.8; }
          50% { transform: translateY(50vh) rotate(180deg) translateX(var(--sway)); }
          100% { opacity: 0; transform: translateY(110vh) rotate(360deg) translateX(calc(-1 * var(--sway))); }
        }
        .petal {
          position: absolute;
          top: -10%;
          background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 0C7 0 11 3 11 7C11 11 7 14 7 14C7 14 3 11 3 7C3 3 7 0 7 0Z' fill='%23FECDD3'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
      {petals.map(p => (
        <div 
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
            '--sway': p.sway
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
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
    customMapLink: '', wazeLink: '', type: 'sightseeing', cost: 0, myrCost: 0, notes: '',
    flightNo: '', terminal: ''
  });

  const [localJPY, setLocalJPY] = useState<string>('');
  const [localMYR, setLocalMYR] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const jpyVal = initialData.cost ?? 0;
        const myrVal = initialData.myrCost ?? (jpyVal * exchangeRate);
        setFormData({ 
          ...initialData, 
          cost: jpyVal,
          myrCost: myrVal,
          customMapLink: initialData.customMapLink ?? '',
          wazeLink: initialData.wazeLink ?? '',
          notes: initialData.notes ?? '',
          flightNo: initialData.flightNo ?? '',
          terminal: initialData.terminal ?? ''
        });
        setLocalJPY(jpyVal === 0 ? '' : jpyVal.toString());
        setLocalMYR(myrVal === 0 ? '' : myrVal.toString());
      } else {
        setFormData({
          id: generateId(), time: '09:00', title: '', description: '', location: '',
          customMapLink: '', wazeLink: '', type: initialType || 'sightseeing', cost: 0, myrCost: 0, notes: '',
          flightNo: '', terminal: ''
        });
        setLocalJPY('');
        setLocalMYR('');
      }
    }
  }, [initialData, isOpen, initialType, exchangeRate]);

  if (!isOpen) return null;

  const handleJPYChange = (val: string) => {
    setLocalJPY(val);
    const jpyNum = parseFloat(val) || 0;
    const myrDerived = parseFloat((jpyNum * exchangeRate).toFixed(2));
    setFormData(prev => ({ ...prev, cost: jpyNum, myrCost: myrDerived }));
    setLocalMYR(myrDerived === 0 ? '' : myrDerived.toString());
  };

  const handleMYRChange = (val: string) => {
    setLocalMYR(val);
    const myrNum = parseFloat(val) || 0;
    const jpyDerived = parseFloat((myrNum / (exchangeRate || 1)).toFixed(2));
    setFormData(prev => ({ ...prev, myrCost: myrNum, cost: jpyDerived }));
    setLocalJPY(jpyDerived === 0 ? '' : jpyDerived.toString());
  };

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
            <div className="col-span-5 sm:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Time</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
            </div>
            <div className="col-span-7 sm:col-span-8">
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Activity Title</label>
            <input type="text" placeholder="e.g., Dinner at the pier" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-lg font-medium" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
            <textarea rows={2} placeholder="Brief details about this activity..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
          </div>

          {formData.type === 'travel' && (
            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Flight Number</label>
                <input type="text" placeholder="e.g., MH123" value={formData.flightNo || ''} onChange={e => setFormData({...formData, flightNo: e.target.value})} className="w-full p-3 bg-sky-50/50 border border-sky-100 rounded-xl outline-none font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Terminal</label>
                <input type="text" placeholder="e.g., T1" value={formData.terminal || ''} onChange={e => setFormData({...formData, terminal: e.target.value})} className="w-full p-3 bg-sky-50/50 border border-sky-100 rounded-xl outline-none font-medium" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location</label>
                <input type="text" placeholder="Address or Place" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cost (JPY)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400 text-sm">¥</span>
                    <input type="number" placeholder="0" value={localJPY} onChange={e => handleJPYChange(e.target.value)} className="w-full p-3 pl-7 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cost (MYR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400 text-[10px] font-bold">RM</span>
                    <input type="number" placeholder="0.00" value={localMYR} onChange={e => handleMYRChange(e.target.value)} className="w-full p-3 pl-9 bg-rose-50/50 border border-rose-100 rounded-xl outline-none font-medium text-rose-700" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Map Link (Google Maps)</label>
                <input type="text" placeholder="Google Maps URL" value={formData.customMapLink || ''} onChange={e => setFormData({...formData, customMapLink: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              {formData.type === 'drive' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                    <CarIcon className="w-3 h-3" /> Waze Link
                  </label>
                  <input type="text" placeholder="Waze Navigation URL" value={formData.wazeLink || ''} onChange={e => setFormData({...formData, wazeLink: e.target.value})} className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl outline-none text-indigo-900 placeholder-indigo-300" />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <NoteIcon className="w-4 h-4" />
              <label className="text-xs font-bold uppercase">Important Details</label>
            </div>
            <textarea 
              rows={2}
              placeholder="Paste Booking IDs, Flight Numbers, Reservation Links here..."
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 bg-white border border-amber-200 rounded-lg outline-none resize-none text-slate-700 text-sm placeholder-slate-400"
            />
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
  let totalJPY = 0;
  let totalMYR = 0;
  const categoryTotals: Record<string, number> = { food: 0, sightseeing: 0, relaxation: 0, travel: 0, stay: 0, shopping: 0, drive: 0, other: 0 };
  trip.dailyPlans.forEach(plan => plan.activities.forEach(act => {
    totalJPY += (act.cost ?? 0);
    totalMYR += (act.myrCost ?? (act.cost || 0) * exchangeRate);
    if (categoryTotals[act.type] !== undefined) categoryTotals[act.type] += (act.cost ?? 0); else categoryTotals['other'] += (act.cost ?? 0);
  }));
  const maxCost = Math.max(...Object.values(categoryTotals), 1);
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
               <h2 className="text-5xl font-serif font-bold mb-1">¥ {totalJPY.toLocaleString()}</h2>
               <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-bold">≈ RM {totalMYR.toFixed(2)}</div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">By Category (JPY)</h4>
              {Object.entries(categoryTotals).map(([cat, cost]) => {
                if (cost === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="capitalize">{cat}</span>
                      <div className="text-right"><span>¥{cost.toLocaleString()}</span></div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${
                        cat === 'food' ? 'bg-orange-400' : cat === 'stay' ? 'bg-emerald-400' : cat === 'travel' ? 'bg-sky-400' : cat === 'drive' ? 'bg-indigo-400' : cat === 'shopping' ? 'bg-purple-400' : 'bg-rose-400'
                      }`} style={{ width: `${(cost / maxCost) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {totalJPY === 0 && <p className="text-center text-slate-400 italic py-8">No costs recorded yet.</p>}
            </div>
         </div>
       </div>
    </div>
  );
};

// --- Weather Modal ---
const WeatherModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl z-10 p-8 flex flex-col animate-slideUp border border-rose-100 text-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 text-sky-600">
            <div className="p-2.5 bg-sky-50 rounded-2xl"><WeatherIcon className="w-6 h-6" /></div>
            <h3 className="font-serif font-bold text-2xl">Weather Forecast</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <CloseIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          <a href="https://tenki.jp/forecast/3/16/4410/13104/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-2xl transition-colors group">
            <div className="flex flex-col">
              <span className="font-bold text-sky-900">Shinjuku</span>
              <span className="text-xs text-sky-600">tenki.jp forecast</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <a href="https://tenki.jp/forecast/1/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-2xl transition-colors group">
            <div className="flex flex-col">
              <span className="font-bold text-sky-900">Hokkaido</span>
              <span className="text-xs text-sky-600">tenki.jp forecast</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

// --- Subway Map / Metro Guide Modal ---
const SubwayMapModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLines = metroLines.map(line => ({
    ...line,
    stations: line.stations.filter(st => 
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      st.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(line => line.stations.length > 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl z-10 p-8 flex flex-col animate-slideUp border border-rose-100 text-slate-800 overflow-hidden max-h-[85vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-2.5 bg-rose-50 rounded-2xl"><MapIcon className="w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-rose-950">Metro Guide</h3>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Yard Maps & Routes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search station name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 transition-all font-medium text-sm"
          />
          <CameraIcon className="absolute left-4 top-4 w-5 h-5 text-slate-400 rotate-90" />
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar">
          {!searchTerm && (
            <div className="space-y-2">
              <a href="https://www.tokyometro.jp/en/subwaymap/index.html" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-sm hover:bg-slate-800 transition-all group text-sm">
                <div className="flex items-center gap-3"><MapIcon className="w-5 h-5 text-rose-400" /><span>Official Route Search</span></div>
                <ArrowRightIcon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </a>
              <a href="https://www.tokyometro.jp/station/pdf/202305/202305_number_en.pdf" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between p-4 bg-rose-50 text-rose-800 rounded-[1.5rem] font-bold hover:bg-rose-100 transition-all group text-sm">
                <div className="flex items-center gap-3"><PlaneIcon className="w-5 h-5 opacity-70" /><span>High-Res PDF Network Map</span></div>
                <ArrowRightIcon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </a>
            </div>
          )}

          <div className="pt-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
              {searchTerm ? 'Search Results' : 'Select Line to View Stations'}
            </h4>
            <div className="space-y-2">
              {filteredLines.map(line => (
                <div key={line.id} className="border border-slate-100 rounded-2xl overflow-hidden transition-all shadow-sm">
                  <button 
                    onClick={() => setExpandedLine(expandedLine === line.id ? null : line.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ backgroundColor: line.color }}>{line.id}</div>
                      <span className="text-sm font-bold text-slate-700">{line.name}</span>
                    </div>
                    <div className={`transition-transform duration-300 ${(expandedLine === line.id || searchTerm) ? 'rotate-90' : ''}`}><ArrowRightIcon className="w-4 h-4 text-slate-300" /></div>
                  </button>
                  
                  {(expandedLine === line.id || searchTerm) && (
                    <div className="bg-slate-50 p-2 grid grid-cols-1 gap-1 animate-fadeIn">
                       {!searchTerm && <a href={`https://www.tokyometro.jp/lang_en/station/line_${line.routeUrlName}/index.html`} target="_blank" rel="noreferrer" className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-2 block text-center border-b border-rose-100 pb-1">View Full Line Route →</a>}
                       <div className="grid grid-cols-2 gap-1">
                          {line.stations.map(st => (
                            <a 
                              key={st.id} 
                              href={`https://www.tokyometro.jp/lang_en/station/yardmap_img/figure_yardmap_${st.urlName}_all.jpg`}
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 bg-white text-[11px] font-medium text-slate-600 rounded-lg hover:text-rose-500 hover:border-rose-200 border border-transparent shadow-sm flex items-center gap-2 transition-all"
                            >
                              <span 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: line.color }}
                              >
                                {st.id}
                              </span>
                              <span className="truncate">{st.name}</span>
                            </a>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredLines.length === 0 && <div className="text-center py-10 text-slate-400 italic text-sm">No stations found...</div>}
            </div>
          </div>
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
        id: 'init', role: 'model', text: currentTrip ? `Hi! I'm ready to help with your trip to ${currentTrip.destination}. Need suggestions?` : `Hi! I'm your travel assistant.`
      }]);
    }
  }, [isOpen, currentTrip, messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !currentTrip) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const history = messages.filter(m => m.id !== 'init').map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const result = await sendChatMessage(input, history, currentTrip);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: result.text || "Found it!", groundingMetadata: result.candidates?.[0]?.groundingMetadata?.groundingChunks }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error connecting." }]);
    } finally { setIsTyping(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-white/95 w-full h-[85vh] sm:h-[600px] sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-slideUp border border-white/50">
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center space-x-2"><SparklesIcon className="w-5 h-5" /><span className="font-bold">Trip Assistant</span></div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><BackIcon className="w-6 h-6 rotate-[-90deg] sm:rotate-0" /></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-none shadow-rose-200' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                {msg.groundingMetadata && (
                   <div className="mt-2 space-y-1 border-t border-slate-100 pt-2"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sources</div>
                     {msg.groundingMetadata.map((chunk: any, i: number) => chunk.web && (<a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-500 hover:underline truncate">{chunk.web.title || chunk.web.uri}</a>))}
                   </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm"><div className="flex space-x-1"><div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-150"></div></div></div></div>}
        </div>
        <div className="p-4 bg-white border-t border-slate-100"><div className="flex items-center space-x-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 focus-within:border-rose-400 transition-all shadow-inner"><input type="text" placeholder="Ask about your trip..." className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} /><button onClick={handleSend} disabled={!input.trim() || isTyping} className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 disabled:opacity-50 transition-colors"><ArrowRightIcon className="w-4 h-4" /></button></div></div>
      </div>
    </div>
  );
};

// --- Documents Modal ---
const createBlobUrl = (dataUri: string) => {
  try {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return URL.createObjectURL(blob);
  } catch (e) {
    return dataUri;
  }
};

const DocumentsModal = ({ isOpen, onClose, trip, onUpdateTrip, docType = 'documents' }: { isOpen: boolean, onClose: () => void, trip: Trip, onUpdateTrip: (t: Trip) => void, docType?: 'documents' | 'klookDocuments' | 'boardingPasses' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewingDoc && viewingDoc.type.includes('pdf')) {
      const url = createBlobUrl(viewingDoc.url);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBlobUrl(null);
    }
  }, [viewingDoc]);

  if (!isOpen) return null;

  if (viewingDoc) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" onClick={() => setViewingDoc(null)}></div>
        <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl z-10 flex flex-col animate-slideUp overflow-hidden">
          <div className="flex justify-between items-start p-4 border-b border-slate-100 gap-4">
            <h3 className="text-lg font-bold text-slate-800 break-words whitespace-normal flex-1">{viewingDoc.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {viewingDoc.type.includes('pdf') && (
                <a 
                  href={blobUrl || viewingDoc.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  Open Fullscreen
                </a>
              )}
              <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-100 rounded-full"><CloseIcon className="w-6 h-6" /></button>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 overflow-hidden flex items-center justify-center">
            {viewingDoc.type.includes('pdf') ? (
              blobUrl ? (
                <iframe src={blobUrl} className="w-full h-full border-none" title={viewingDoc.name} />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">Loading PDF...</p>
                </div>
              )
            ) : (
              <img src={viewingDoc.url} alt={viewingDoc.name} className="max-w-full max-h-full object-contain" />
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only allow PDF and images
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      alert('Please upload a PDF or image file.');
      return;
    }

    // Limit size to 2MB to avoid huge JSON payloads
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Please upload a file smaller than 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        const newDoc: Document = {
          id: generateId(),
          name: file.name,
          url: base64Data,
          type: file.type,
          size: file.size,
          uploadedAt: Date.now()
        };
        
        const currentDocs = trip[docType] || [];
        onUpdateTrip({
          ...trip,
          [docType]: [...currentDocs, newDoc]
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading file:', err);
      setIsUploading(false);
    }
  };

  const handleDelete = (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const currentDocs = trip[docType] || [];
    onUpdateTrip({
      ...trip,
      [docType]: currentDocs.filter(d => d.id !== docId)
    });
  };

  const handleRename = (docId: string) => {
    if (!editingDocName.trim()) return;
    const currentDocs = trip[docType] || [];
    onUpdateTrip({
      ...trip,
      [docType]: currentDocs.map(d => d.id === docId ? { ...d, name: editingDocName.trim() } : d)
    });
    setEditingDocId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleView = (doc: Document) => {
    if (doc.type.includes('pdf')) {
      const url = createBlobUrl(doc.url);
      window.open(url, '_blank');
    } else {
      setViewingDoc(doc);
    }
  };

  const documents = trip[docType] || [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
       <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl z-10 p-8 flex flex-col max-h-[85vh] animate-slideUp text-slate-800">
         <div className="flex justify-between items-center mb-6">
           <div className="flex items-center space-x-3 text-rose-600">
             <div className="p-2.5 bg-rose-50 rounded-2xl"><FileIcon className="w-6 h-6" /></div>
             <div>
               <h3 className="text-2xl font-serif font-bold text-rose-950">{docType === 'klookDocuments' ? 'Klook Docs' : docType === 'boardingPasses' ? 'Boarding Passes' : 'Documents'}</h3>
               <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">{docType === 'klookDocuments' ? 'Vouchers & Tickets' : docType === 'boardingPasses' ? 'Flight Check-in Docs' : 'Hotel & Travel Docs'}</p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full"><CloseIcon className="w-6 h-6" /></button>
         </div>
         
         <div className="overflow-y-auto pr-2 space-y-4 flex-1 no-scrollbar">
            {documents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                <FileIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No documents uploaded yet.</p>
                <p className="text-xs text-slate-400 mt-1">Upload {docType === 'klookDocuments' ? 'Klook vouchers' : docType === 'boardingPasses' ? 'boarding passes' : 'hotel bookings'}, tickets, or PDFs (Max 2MB)</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-rose-200 transition-colors gap-3">
                    <div className="flex items-start sm:items-center gap-3 overflow-hidden w-full cursor-pointer" onClick={() => handleView(doc)}>
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0">
                        <FileIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingDocId === doc.id ? (
                          <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingDocName}
                              onChange={(e) => setEditingDocName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(doc.id);
                                if (e.key === 'Escape') setEditingDocId(null);
                              }}
                              className="w-full p-1 text-sm font-bold text-slate-700 border border-rose-300 rounded outline-none focus:ring-2 focus:ring-rose-200"
                              autoFocus
                            />
                            <button onClick={(e) => { e.stopPropagation(); handleRename(doc.id); }} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><CheckIcon className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingDocId(null); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><CloseIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-start sm:items-center gap-2 group/title">
                            <p className="font-bold text-sm text-slate-700 break-words whitespace-normal">{doc.name}</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingDocId(doc.id); setEditingDocName(doc.name); }}
                              className="opacity-100 sm:opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity flex-shrink-0 mt-0.5 sm:mt-0"
                              title="Rename"
                            >
                              <EditIcon className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{formatSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleView(doc); }}
                        className="px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        title="View Document"
                      >
                        View
                      </button>
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        title="Download"
                      >
                        <ArrowRightIcon className="w-4 h-4 rotate-90" />
                      </a>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
         </div>
         
         <div className="mt-6 pt-4 border-t border-slate-100">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".pdf,image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <div className="flex space-x-1"><div className="w-2 h-2 bg-white rounded-full animate-bounce"></div><div className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div></div>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" /> <span>Upload Document</span>
                </>
              )}
            </button>
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
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isBoardingPassOpen, setIsBoardingPassOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isKlookDocumentsOpen, setIsKlookDocumentsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTheme, setEditingTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0.03); 
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('trips').select('data').eq('id', 'our-trip-id').single();
      if (data && !error) setTrip(data.data); else setTrip(createBlankTrip());
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
  const dayTotalJPY = useMemo(() => sortedActivities.reduce((sum, act) => sum + (act.cost ?? 0), 0), [sortedActivities]);
  const dayTotalMYR = useMemo(() => sortedActivities.reduce((sum, act) => sum + (act.myrCost ?? (act.cost ?? 0) * exchangeRate), 0), [sortedActivities, exchangeRate]);
  const isSelectedDayToday = useMemo(() => isToday(trip?.startDate, activeDay), [trip?.startDate, activeDay]);
  const daysUntil = useMemo(() => getDaysUntil(trip?.startDate), [trip?.startDate]);

  if (!trip || isLoading) return <div className="min-h-screen flex items-center justify-center font-serif text-rose-400 animate-pulse text-xl italic">Setting up our romance...</div>;

  const handleUpdate = (t: Trip) => setTrip({ ...t });
  
  const handleLoveClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView('itinerary');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => setIsTransitioning(false), 300);
    }, 1100);
  };

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
    setSelectedActivities(prev => prev.filter(actId => actId !== id));
  };

  const handleMoveActivities = (targetDay: number) => {
    if (!trip) return;
    
    const sourcePlan = trip.dailyPlans.find(p => p.dayNumber === activeDay);
    const targetPlan = trip.dailyPlans.find(p => p.dayNumber === targetDay);
    
    if (!sourcePlan || !targetPlan) return;

    const activitiesToMove = sourcePlan.activities.filter(a => selectedActivities.includes(a.id));
    const remainingActivities = sourcePlan.activities.filter(a => !selectedActivities.includes(a.id));

    const updatedPlans = trip.dailyPlans.map(p => {
      if (p.dayNumber === activeDay) {
        return { ...p, activities: remainingActivities };
      }
      if (p.dayNumber === targetDay) {
        return { ...p, activities: [...p.activities, ...activitiesToMove] };
      }
      return p;
    });

    handleUpdate({ ...trip, dailyPlans: updatedPlans });
    setSelectedActivities([]);
    setIsMoveModalOpen(false);
  };

  const addDay = () => {
    const newDayNum = trip.dailyPlans.length + 1;
    const newDay: DailyPlan = { id: generateId(), dayNumber: newDayNum, activities: [], theme: `New Adventure` };
    handleUpdate({ ...trip, duration: newDayNum, dailyPlans: [...trip.dailyPlans, newDay] });
    setActiveDay(newDayNum);
    setSelectedActivities([]);
  };

  const generateOfflineHTML = () => {
    if (!trip) return;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OFFLINE: ${trip.destination} Itinerary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #334155; max-width: 800px; margin: 0 auto; padding: 20px; background: #fdf2f2; }
    h1 { color: #9f1239; font-size: 2.5rem; margin-bottom: 0; }
    .subtitle { color: #f43f5e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem; margin-bottom: 30px; }
    .day-container { background: white; border-radius: 20px; padding: 25px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-left: 8px solid #be123c; }
    .day-header { font-size: 1.5rem; font-weight: bold; color: #1e293b; border-bottom: 2px solid #fee2e2; padding-bottom: 10px; margin-bottom: 20px; }
    .activity { margin-bottom: 25px; position: relative; padding-left: 20px; }
    .activity::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #fecdd3; }
    .time { font-weight: bold; color: #e11d48; font-size: 0.9rem; }
    .title { font-weight: bold; font-size: 1.1rem; color: #0f172a; display: block; }
    .location { font-size: 0.85rem; color: #64748b; font-style: italic; text-decoration: none; }
    .location:hover { text-decoration: underline; color: #3b82f6; }
    .desc { font-size: 0.95rem; margin-top: 5px; color: #475569; }
    .notes { background: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 10px; font-size: 0.8rem; margin-top: 10px; color: #92400e; }
    .general-notes { background: #fff; padding: 20px; border-radius: 20px; margin-top: 40px; border: 1px solid #e2e8f0; }
    .footer { text-align: center; font-size: 0.75rem; color: #94a3b8; margin-top: 50px; }
  </style>
</head>
<body>
  <h1>${trip.destination}</h1>
  <div class="subtitle">Itinerary for Vin & Dolly | Start: ${trip.startDate || 'TBD'}</div>
  
  <div class="general-notes">
    <strong>Important Trip Notes:</strong><br/>
    <pre style="white-space: pre-wrap; font-family: inherit;">${trip.notes}</pre>
  </div>

  ${trip.dailyPlans.map(day => day.activities.length > 0 ? `
    <div class="day-container">
      <div class="day-header">DAY ${day.dayNumber}: ${day.theme}</div>
      ${[...day.activities].sort((a, b) => a.time.localeCompare(b.time)).map(act => {
        const mapUrl = act.customMapLink || (act.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}` : '');
        return `
        <div class="activity">
          <span class="time">${act.time}</span>
          <span class="title">${act.title}</span>
          ${act.location ? `<a class="location" href="${mapUrl}" target="_blank" rel="noreferrer">${act.location}</a>` : ''}
          <p class="desc">${act.description}</p>
          ${act.notes ? `<div class="notes">${act.notes}</div>` : ''}
        </div>
      `}).join('')}
    </div>
  ` : '').join('')}

  <div class="footer">Generated via OurJourney Offline Export</div>
</body>
</html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Itinerary_${trip.destination.replace(/\s+/g, '_')}_Offline.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen">
      {/* Global Transition Overlay */}
      <div 
        className={`fixed inset-0 z-[1000] pointer-events-none transition-all duration-[1200ms] ease-in-out ${
          isTransitioning ? 'bg-white opacity-100' : 'bg-transparent opacity-0'
        }`}
      />

      {view === 'dashboard' ? (
        <div className={`min-h-screen flex flex-col sakura-bg animate-fadeIn overflow-hidden transition-all duration-[1000ms] ${isTransitioning ? 'scale-[0.85] opacity-0 blur-md' : 'scale-100 opacity-100 blur-0'}`}>
          <SakuraRain intensity={isTransitioning ? 200 : 35} isRamping={isTransitioning} />
          <header className="bg-transparent p-4 relative z-10">
             <div className="max-w-3xl mx-auto flex items-center justify-between"><div className="w-10"></div><div className="w-10"></div><div className="flex items-center gap-2"><button onClick={() => setIsNotesOpen(!isNotesOpen)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><NoteIcon className="w-5 h-5" /></button></div></div>
          </header>
          <main className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col items-center justify-center space-y-8 relative z-10">
             <section className="text-center py-4 space-y-2">
                <h2 className="text-6xl font-serif font-bold text-slate-800 tracking-tight leading-tight">{trip.destination}</h2>
                <p className="text-rose-400 font-bold tracking-[0.2em] uppercase text-xs">Journey for Vin & Dolly</p>
                <div className="pt-6">
                  <button 
                    className="relative bg-white p-8 rounded-full shadow-2xl border border-rose-100 group cursor-pointer active:scale-95 transition-all transform hover:scale-110" 
                    onClick={handleLoveClick}
                  >
                    <div className={`absolute inset-0 bg-rose-200 rounded-full ${isTransitioning ? 'animate-ping' : ''} opacity-20 group-hover:opacity-40`}></div>
                    <HeartIcon className={`w-14 h-14 text-rose-500 relative transition-all duration-[1000ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${isTransitioning ? 'scale-[6] rotate-[25deg] opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
                    <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-300 uppercase tracking-widest transition-opacity ${isTransitioning ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} whitespace-nowrap`}>Open Itinerary</div>
                  </button>
                </div>
                {daysUntil !== null && (<div className="pt-12"><div className="bg-white/50 backdrop-blur inline-block px-10 py-4 rounded-full border border-rose-100 shadow-sm"><span className="text-rose-600 font-bold text-base tracking-wide">{daysUntil > 0 ? `${daysUntil} Days To Go! ❤️` : daysUntil === 0 ? "It's Travel Day! ✈️" : "Memories made!"}</span></div></div>)}
             </section>
             <div className="w-full max-w-2xl mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <button onClick={() => setIsBoardingPassOpen(true)} className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-50 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors"><PlaneIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Passport &<br/>Flight Info</span></button>
                <button onClick={() => setIsMetroGuideOpen(true)} className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-50 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors"><MapIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Tokyo Metro<br/>Resources</span></button>
                <a href="https://uu-nippon.com/hokkaido/wp/wp-content/uploads/2021/03/map_sw_sapporo1_en-1536x1229.png" target="_blank" rel="noreferrer" className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-50 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors"><MapIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Hokkaido<br/>Subway Map</span></a>
                <a href="https://media2.tokyodisneyresort.jp/home/download/map/TDL_map_en.pdf" target="_blank" rel="noreferrer" className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-100 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors"><SparklesIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Disneyland<br/>Tokyo Map</span></a>
                <button onClick={() => setIsDocumentsOpen(true)} className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-50 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><FileIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Hotel &<br/>Documents</span></button>
                <button onClick={() => setIsKlookDocumentsOpen(true)} className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-50 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors"><FileIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Klook<br/>Documents</span></button>
                <button onClick={() => setIsWeatherOpen(true)} className="bg-white/90 p-5 rounded-[2.5rem] shadow-sm border border-rose-50 flex flex-col items-center gap-3 group hover:shadow-xl hover:shadow-rose-50 hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors"><WeatherIcon className="w-6 h-6" /></div><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-tight">Weather<br/>Forecast</span></button>
             </div>
          </main>
          {isNotesOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsNotesOpen(false)}></div><div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl z-10 animate-slideUp text-slate-800 max-h-[85vh] overflow-y-auto no-scrollbar"><div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="font-serif font-bold text-2xl text-rose-950 flex items-center gap-2"><PlaneIcon className="w-6 h-6 text-rose-500" />Essential Info</h3><button onClick={() => setIsNotesOpen(false)}><CloseIcon className="w-6 h-6 text-slate-400" /></button></div><div className="space-y-6"><div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Trip Start Date</label><input type="date" className="w-full p-4 bg-rose-50 rounded-2xl outline-none" value={trip.startDate || ''} onChange={e => handleUpdate({...trip, startDate: e.target.value})} /></div><div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Exchange Rate (100 JPY to MYR)</label><div className="flex items-center gap-2 bg-rose-50 p-4 rounded-2xl"><input type="number" step="0.01" className="bg-transparent border-b border-rose-300 outline-none w-20 text-center font-bold" value={(exchangeRate * 100).toFixed(2)} onChange={e => setExchangeRate((parseFloat(e.target.value) || 0) / 100)} /><span className="text-xs font-bold">MYR</span></div></div><div><label className="block text-xs font-bold text-rose-400 uppercase mb-2">Passport & Flight Details</label><textarea className="w-full h-48 p-4 bg-rose-50 rounded-2xl outline-none resize-none text-sm leading-relaxed" placeholder="Enter details..." value={trip.notes || ''} onChange={e => handleUpdate({...trip, notes: e.target.value})} /></div></div></div></div>
          )}
        </div>
      ) : (
        <div className="min-h-screen flex flex-col sakura-bg transition-opacity duration-300">
           <SakuraRain />
           <header className={`bg-white/95 backdrop-blur-md sticky top-0 z-[60] border-b border-rose-100 transition-all duration-300 ${isScrolled ? 'py-1 shadow-md' : 'py-3'}`}><div className="max-w-3xl mx-auto px-4"><div className="flex items-center justify-between gap-2 mb-2"><button onClick={() => setView('dashboard')} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full flex-shrink-0"><HomeIcon className="w-5 h-5" /></button><div className="flex-1 text-center min-w-0" onClick={() => setEditingTitle(true)}>{editingTitle ? (<input autoFocus className="font-serif font-bold text-lg outline-none w-full border-b-2 border-rose-200 bg-transparent text-center text-slate-800" defaultValue={trip.destination} onBlur={e => { handleUpdate({...trip, destination: e.target.value}); setEditingTitle(false); }} />) : (<div className="flex flex-col items-center"><h2 className={`font-serif font-bold text-rose-950 truncate transition-all ${isScrolled ? 'text-sm' : 'text-base'}`}>{trip.destination}</h2></div>)}</div><div className="flex items-center gap-1"><button onClick={generateOfflineHTML} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors" title="Export Offline HTML"><PieChartIcon className="w-5 h-5" /></button><button onClick={() => setIsBudgetOpen(true)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><WalletIcon className="w-5 h-5" /></button></div></div><div className="overflow-x-auto scroll-smooth no-scrollbar -mx-4 px-4 py-2 select-none touch-pan-x active:cursor-grabbing"><div className="flex gap-2 w-max items-center flex-nowrap pr-12 min-w-full">{trip.dailyPlans.map(p => (<button key={p.id} onClick={() => { setActiveDay(p.dayNumber); setIsNotesOpen(false); }} className={`flex flex-col items-center justify-center rounded-2xl border transition-all flex-shrink-0 ${isScrolled ? 'w-[3.4rem] h-11' : 'w-[4.2rem] h-13'} ${activeDay === p.dayNumber && !isNotesOpen ? 'bg-rose-900 border-rose-900 text-white shadow-md scale-105' : 'bg-white border-rose-100 text-rose-400 hover:border-rose-300'}`}><span className="text-[8px] font-bold uppercase opacity-70">Day {p.dayNumber}</span><span className="text-xs font-bold leading-none mt-0.5">{getDayOfMonth(trip.startDate, p.dayNumber - 1) || p.dayNumber}</span></button>))}<button onClick={addDay} className={`flex items-center justify-center text-rose-200 flex-shrink-0 bg-white border border-dashed border-rose-200 rounded-2xl hover:border-rose-400 hover:text-rose-400 transition-colors ${isScrolled ? 'w-[3rem] h-11' : 'w-[3.5rem] h-13'}`} title="Add Day"><PlusIcon className="w-5 h-5" /></button></div></div></div></header>
           <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-40"><div className="space-y-6 animate-fadeIn"><div className="flex items-center justify-between px-1"><div onClick={() => setEditingTheme(true)} className="flex-1 min-w-0"><div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">{getFormattedDate(trip.startDate, activeDay - 1)}</div>{editingTheme ? (<input autoFocus className="text-xl font-serif font-bold text-rose-950 border-b border-rose-100 outline-none bg-transparent w-full" defaultValue={currentDayPlan?.theme} onBlur={e => { handleUpdate({...trip, dailyPlans: trip.dailyPlans.map(p => p.dayNumber === activeDay ? {...p, theme: e.target.value} : p)}); setEditingTheme(false); }} />) : (<h2 className="text-xl font-serif font-bold text-rose-950 flex items-center gap-2 truncate group cursor-pointer">Day {activeDay}: {currentDayPlan?.theme} <EditIcon className="w-3 h-3 text-rose-200 group-hover:text-rose-400 transition-colors" /></h2>)}</div><div className="text-right ml-4 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-100 flex-shrink-0 text-slate-800 shadow-sm"><div className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter italic text-center">Daily Total</div><div className="font-bold text-rose-950 text-sm">¥{dayTotalJPY.toLocaleString()}</div><div className="text-[9px] font-bold text-rose-400 text-center">≈ RM {dayTotalMYR.toFixed(2)}</div></div></div><div className="relative border-l-2 border-rose-200/50 ml-4 sm:ml-6 space-y-6 pb-4 pl-6 sm:pl-10 text-slate-800">{sortedActivities.length === 0 && <div className="py-24 text-center border-2 border-dashed border-rose-100 rounded-[3rem] text-rose-300 italic ml-[-2rem]">Empty schedule for today.</div>}{sortedActivities.map((act, idx) => { 
            const ongoing = isSelectedDayToday && isActivityOngoing(act.time, sortedActivities[idx+1]?.time); 
            const isDrive = act.type === 'drive';
            const isTravel = act.type === 'travel';
            const hasCustomMap = !!act.customMapLink;
            const hasWaze = !!act.wazeLink;
            const shouldShowMapBtn = hasCustomMap || (isDrive && act.location);
            const mapUrl = hasCustomMap ? act.customMapLink : (isDrive && act.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}` : undefined);
            
            const isSelected = selectedActivities.includes(act.id);
            
            return (<div key={act.id} className="relative group"><div onClick={(e) => { e.stopPropagation(); if (isSelected) { setSelectedActivities(prev => prev.filter(id => id !== act.id)); } else { setSelectedActivities(prev => [...prev, act.id]); } }} className={`absolute -left-[33px] sm:-left-[49px] top-6 w-4 h-4 rounded-full border-2 z-10 transition-all cursor-pointer hover:scale-125 flex items-center justify-center ${isSelected ? 'bg-rose-500 border-rose-500 ring-4 ring-rose-200' : ongoing ? 'bg-white border-rose-500 ring-8 ring-rose-100 scale-125' : 'bg-white border-rose-300 hover:border-rose-400'}`}>{isSelected && <CheckIcon className="w-3 h-3 text-white" />}</div><div onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className={`group bg-white/95 backdrop-blur-sm p-4 rounded-[2rem] shadow-sm border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${isSelected ? 'border-rose-300 shadow-rose-100' : 'border-white hover:border-rose-100 shadow-rose-50/50'}`}><div className="flex justify-between items-start mb-2 gap-2 text-slate-800"><div className="flex items-center gap-2 min-w-0"><span className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">{act.time}</span><h4 className="font-bold text-sm truncate">{act.title}</h4></div><button onClick={e => { e.stopPropagation(); handleDeleteActivity(act.id); }} className="p-1 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><TrashIcon className="w-3.5 h-3.5" /></button></div><div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mb-3"><div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${ act.type === 'food' ? 'bg-orange-50 text-orange-600 border-orange-100' : act.type === 'sightseeing' ? 'bg-blue-50 text-blue-600 border-blue-100' : act.type === 'shopping' ? 'bg-purple-50 text-purple-600 border-purple-100' : act.type === 'relaxation' ? 'bg-pink-50 text-pink-600 border-pink-100' : act.type === 'stay' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : act.type === 'travel' ? 'bg-sky-50 text-sky-600 border-sky-100' : act.type === 'drive' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100' }`}><ActivityIcon type={act.type} className="w-3 h-3" /><span className="uppercase font-bold tracking-widest">{act.type}</span></div>{(act.cost ?? 0) > 0 && <span className="text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-xl border border-rose-100 flex items-center gap-1">¥{(act.cost ?? 0).toLocaleString()} <span className="opacity-40 text-[9px] font-normal">|</span> RM {(act.myrCost ?? (act.cost || 0) * exchangeRate).toFixed(2)}</span>}{isTravel && (act.flightNo || act.terminal) && (<div className="flex items-center gap-2 font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-xl border border-sky-100">{act.flightNo && <span>Flight: {act.flightNo}</span>}{act.terminal && <span>Terminal: {act.terminal}</span>}</div>)}</div>
                   <div className="flex flex-col gap-2">
                     <div className="flex items-end justify-between gap-4">
                       <p className="text-xs text-slate-600 line-clamp-2 flex-1 leading-relaxed">{act.description}</p>
                       <div className="flex items-center gap-2 flex-shrink-0 z-20">
                         {hasWaze && (
                            <a href={act.wazeLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100" title="Open in Waze">
                               <CarIcon className="w-3.5 h-3.5 text-indigo-500" />
                            </a>
                         )}
                         {shouldShowMapBtn && mapUrl && (
                           <a href={mapUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors border border-rose-100" title="View Map">
                             <MapIcon className="w-3.5 h-3.5 text-rose-400" />
                           </a>
                         )}
                       </div>
                     </div>
                     {act.notes && (
                       <div className="flex items-start gap-2 p-2 bg-amber-50/50 rounded-lg border border-amber-100/50">
                         <NoteIcon className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                         <p className="text-[10px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{act.notes}</p>
                       </div>
                     )}
                   </div>
                   </div></div>); })}</div></div></main>
           <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-50"><div className="max-w-3xl mx-auto flex justify-center pointer-events-auto"><div className="bg-white/95 backdrop-blur-xl border border-rose-100 shadow-2xl rounded-[2.5rem] p-2 flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[95vw]">{[ {t:'sightseeing', l:'Place', i:<CameraIcon className="w-5 h-5" />, c:'blue'}, {t:'food', l:'Food', i:<CoffeeIcon className="w-5 h-5" />, c:'orange'}, {t:'stay', l:'Stay', i:<BedIcon className="w-5 h-5" />, c:'emerald'}, {t:'shopping', l:'Shop', i:<ShoppingBagIcon className="w-5 h-5" />, c:'rose'} , {t:'travel', l:'Travel', i:<PlaneIcon className="w-5 h-5" />, c:'sky'}, {t:'drive', l:'Drive', i:<CarIcon className="w-5 h-5" />, c:'indigo'} ].map(btn => (<button key={btn.t} onClick={() => { setEditingActivity(null); setAddingType(btn.t as ActivityType); setIsActivityModalOpen(true); }} className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 group min-w-[3.5rem] sm:min-w-[4rem]"><div className={`w-10 h-10 rounded-2xl bg-${btn.c}-50 text-${btn.c}-500 flex items-center justify-center mb-1 shadow-sm transition-all group-active:scale-90 group-hover:scale-105`}>{btn.i}</div><span className="text-[8px] font-bold text-slate-500 uppercase">{btn.l}</span></button>))}<div className="w-px h-8 bg-rose-100 mx-1"></div><button onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }} className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 group min-w-[3.5rem] sm:min-w-[4rem]"><div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-1 shadow-lg group-active:scale-90 group-hover:scale-105 transition-all"><PlusIcon className="w-5 h-5" /></div><span className="text-[8px] font-bold text-rose-500 uppercase">Custom</span></button></div></div></div>
        </div>
      )}

      {/* Modals outside conditional view */}
      <ActivityModal isOpen={isActivityModalOpen} onClose={() => { setIsActivityModalOpen(false); setEditingActivity(null); setAddingType(undefined); }} onSave={handleSaveActivity} initialData={editingActivity} initialType={addingType} exchangeRate={exchangeRate} />
      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} trip={trip} exchangeRate={exchangeRate} />
      <SubwayMapModal isOpen={isMetroGuideOpen} onClose={() => setIsMetroGuideOpen(false)} />
      <WeatherModal isOpen={isWeatherOpen} onClose={() => setIsWeatherOpen(false)} />
      <DocumentsModal isOpen={isDocumentsOpen} onClose={() => setIsDocumentsOpen(false)} trip={trip} onUpdateTrip={handleUpdate} docType="documents" />
      <DocumentsModal isOpen={isKlookDocumentsOpen} onClose={() => setIsKlookDocumentsOpen(false)} trip={trip} onUpdateTrip={handleUpdate} docType="klookDocuments" />
      <DocumentsModal isOpen={isBoardingPassOpen} onClose={() => setIsBoardingPassOpen(false)} trip={trip} onUpdateTrip={handleUpdate} docType="boardingPasses" />
      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentTrip={trip} />

      {selectedActivities.length > 0 && view === 'itinerary' && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-4 animate-slideUp">
          <span className="text-sm font-bold">{selectedActivities.length} selected</span>
          <div className="w-px h-4 bg-slate-700"></div>
          <button onClick={() => setIsMoveModalOpen(true)} className="text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors">Move</button>
          <button onClick={() => setSelectedActivities([])} className="text-sm font-bold text-slate-400 hover:text-slate-300 transition-colors">Cancel</button>
        </div>
      )}

      {isMoveModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsMoveModalOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl z-10 p-8 flex flex-col animate-slideUp">
            <h3 className="text-xl font-serif font-bold text-rose-950 mb-2">Move Activities</h3>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to move {selectedActivities.length} selected {selectedActivities.length === 1 ? 'activity' : 'activities'}? Select the destination day below.</p>
            
            <select 
              defaultValue=""
              onChange={e => {
                const targetDay = Number(e.target.value);
                handleMoveActivities(targetDay);
              }}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium mb-6"
            >
              <option value="" disabled>Select destination day...</option>
              {trip.dailyPlans.map(p => (
                <option key={p.dayNumber} value={p.dayNumber} disabled={p.dayNumber === activeDay}>
                  Day {p.dayNumber} {p.theme ? `- ${p.theme}` : ''}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;