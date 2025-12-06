import { 
  Heart, 
  MapPin, 
  Calendar, 
  Coffee, 
  Camera, 
  Plane, 
  Moon, 
  Sun, 
  Map, 
  MessageCircle, 
  ArrowRight,
  Sparkles,
  ChevronLeft,
  Menu,
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  FileText,
  Home,
  BedDouble,
  Wallet,
  PieChart,
  ShoppingBag
} from 'lucide-react';

export const HeartIcon = ({ className }: { className?: string }) => <Heart className={className} />;
export const MapPinIcon = ({ className }: { className?: string }) => <MapPin className={className} />;
export const CalendarIcon = ({ className }: { className?: string }) => <Calendar className={className} />;
export const CoffeeIcon = ({ className }: { className?: string }) => <Coffee className={className} />;
export const CameraIcon = ({ className }: { className?: string }) => <Camera className={className} />;
export const PlaneIcon = ({ className }: { className?: string }) => <Plane className={className} />;
export const MoonIcon = ({ className }: { className?: string }) => <Moon className={className} />;
export const SunIcon = ({ className }: { className?: string }) => <Sun className={className} />;
export const MapIcon = ({ className }: { className?: string }) => <Map className={className} />;
export const ChatIcon = ({ className }: { className?: string }) => <MessageCircle className={className} />;
export const ArrowRightIcon = ({ className }: { className?: string }) => <ArrowRight className={className} />;
export const SparklesIcon = ({ className }: { className?: string }) => <Sparkles className={className} />;
export const BackIcon = ({ className }: { className?: string }) => <ChevronLeft className={className} />;
export const MenuIcon = ({ className }: { className?: string }) => <Menu className={className} />;
export const CloseIcon = ({ className }: { className?: string }) => <X className={className} />;
export const PlusIcon = ({ className }: { className?: string }) => <Plus className={className} />;
export const TrashIcon = ({ className }: { className?: string }) => <Trash2 className={className} />;
export const EditIcon = ({ className }: { className?: string }) => <Edit2 className={className} />;
export const SaveIcon = ({ className }: { className?: string }) => <Save className={className} />;
export const CheckIcon = ({ className }: { className?: string }) => <CheckCircle className={className} />;
export const NoteIcon = ({ className }: { className?: string }) => <FileText className={className} />;
export const HomeIcon = ({ className }: { className?: string }) => <Home className={className} />;
export const BedIcon = ({ className }: { className?: string }) => <BedDouble className={className} />;
export const WalletIcon = ({ className }: { className?: string }) => <Wallet className={className} />;
export const PieChartIcon = ({ className }: { className?: string }) => <PieChart className={className} />;
export const ShoppingBagIcon = ({ className }: { className?: string }) => <ShoppingBag className={className} />;

export const ActivityIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'food': return <CoffeeIcon className={className} />;
    case 'sightseeing': return <CameraIcon className={className} />;
    case 'relaxation': return <MoonIcon className={className} />;
    case 'travel': return <PlaneIcon className={className} />;
    case 'stay': return <BedIcon className={className} />;
    case 'shopping': return <ShoppingBagIcon className={className} />;
    default: return <MapPinIcon className={className} />;
  }
};