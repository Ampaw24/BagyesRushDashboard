import type { ReactElement, SVGProps } from "react";
import {
  Activity,
  Archive,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Bell,
  ChartColumn,
  ChartLine,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Clock,
  Copy,
  EllipsisVertical,
  Eye,
  Image as ImageGlyph,
  KeyRound,
  LayoutGrid,
  LockOpen,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageCircleQuestionMark,
  MessageSquare,
  Moon,
  Package,
  PanelLeft,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Store,
  Sun,
  Table,
  Ticket,
  TriangleAlert,
  Truck,
  UserCheck,
  Users,
  UserX,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

type IconProps = { className?: string };
export type IconComponent = (props: IconProps) => ReactElement;

// All dashboard icons come from Lucide (https://lucide.dev) so the whole
// product uses one consistent icon language instead of hand-drawn one-offs.
// Wrapping here means every call site keeps using the same
// `<XyzIcon className="h-4 w-4" />` API regardless of the underlying icon pack.
function createIcon(Source: LucideIcon, size = 20, extraProps: SVGProps<SVGSVGElement> = {}): IconComponent {
  return function Icon({ className }: IconProps) {
    return <Source className={className} size={size} {...extraProps} />;
  };
}

export const OverviewIcon = createIcon(LayoutGrid);
export const OrdersIcon = createIcon(Package);
export const RidersIcon = createIcon(Truck);
export const AnalyticsIcon = createIcon(ChartColumn);
export const PanelLeftIcon = createIcon(PanelLeft);
export const LogoutIcon = createIcon(LogOut);
export const SearchIcon = createIcon(Search);
export const ArrowUpIcon = createIcon(ArrowUp);
export const ArrowDownIcon = createIcon(ArrowDown);
export const TableIcon = createIcon(Table);
export const ChartIcon = createIcon(ChartLine);
export const WalletIcon = createIcon(Wallet);
export const CheckCircleIcon = createIcon(CircleCheckBig);
export const ChevronRightIcon = createIcon(ChevronRight);
export const StarIcon = createIcon(Star, 14, { fill: "currentColor", stroke: "none" });
export const PhoneIcon = createIcon(Phone);
export const SunIcon = createIcon(Sun);
export const MoonIcon = createIcon(Moon);
export const TicketIcon = createIcon(Ticket);
export const UsersIcon = createIcon(Users);
export const SupportIcon = createIcon(MessageCircleQuestionMark);
export const ShieldIcon = createIcon(ShieldCheck);
export const SettingsIcon = createIcon(Settings);
export const ChevronDownIcon = createIcon(ChevronDown);
export const MenuIcon = createIcon(Menu);
export const CloseIcon = createIcon(X);
export const MailIcon = createIcon(Mail);
export const XCircleIcon = createIcon(CircleX);
export const UnlockIcon = createIcon(LockOpen);
export const PlusIcon = createIcon(Plus);
export const MegaphoneIcon = createIcon(Megaphone);
export const BellIcon = createIcon(Bell);
export const ImageIcon = createIcon(ImageGlyph);
export const ChatIcon = createIcon(MessageSquare);
export const CopyIcon = createIcon(Copy);
export const ClockIcon = createIcon(Clock);
export const EyeIcon = createIcon(Eye);
export const MobileIcon = createIcon(Smartphone);
export const ShopIcon = createIcon(Store);
export const SecuritySafeIcon = createIcon(KeyRound);
export const VerifyIcon = createIcon(BadgeCheck);
export const DangerIcon = createIcon(TriangleAlert);
export const RefreshIcon = createIcon(RefreshCw);
export const ArchiveIcon = createIcon(Archive);
export const ActivityIcon = createIcon(Activity);
export const BagIcon = createIcon(ShoppingBag);
export const ProfileTickIcon = createIcon(UserCheck);
export const ProfileDeleteIcon = createIcon(UserX);
export const MoreIcon = createIcon(EllipsisVertical);
