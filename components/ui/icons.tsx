import * as React from "react"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  ArrowUpRightIcon,
  AwardIcon,
  BarChartIcon,
  BellIcon,
  BellOffIcon,
  BellRingIcon,
  BookOpen01Icon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarDaysIcon,
  CalendarPlusIcon,
  Cancel01Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  ContactIcon,
  CursorPointer01Icon,
  Delete02Icon,
  ExternalLinkIcon,
  FavouriteIcon,
  File01Icon,
  FilterHorizontalIcon,
  FolderAddIcon,
  FolderIcon,
  FolderKanbanIcon,
  HelpCircleIcon,
  Home01Icon,
  ImageNotFound01Icon,
  InboxIcon,
  LockIcon,
  Mail01Icon,
  MapPinIcon,
  Menu01Icon,
  MessageCircleReplyIcon,
  MinusSignIcon,
  MoreHorizontalIcon,
  NewsIcon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  PlusSignIcon,
  ReloadIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  Settings02Icon,
  Share01Icon,
  SparklesIcon,
  StarIcon,
  TelephoneIcon,
  ThumbsUpIcon,
  Tick01Icon,
  UserGroupIcon,
  UserIcon,
  UserMultiple02Icon,
  ViewIcon,
  WalletCardsIcon,
} from "@hugeicons/core-free-icons"

export type IconProps = Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon">
export type IconComponent = React.ComponentType<IconProps>
export type LucideIcon = IconComponent

function createIcon(icon: IconSvgElement) {
  function Icon({ size = 18, strokeWidth = 1.7, ...props }: IconProps) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={size}
        strokeWidth={strokeWidth}
        {...props}
      />
    )
  }

  return Icon
}

export const ArrowLeft = createIcon(ArrowLeftIcon)
export const ArrowRight = createIcon(ArrowRightIcon)
export const ArrowUpRight = createIcon(ArrowUpRightIcon)
export const Award = createIcon(AwardIcon)
export const BarChart3 = createIcon(BarChartIcon)
export const Bell = createIcon(BellIcon)
export const BellOff = createIcon(BellOffIcon)
export const BellRing = createIcon(BellRingIcon)
export const BookOpenText = createIcon(BookOpen01Icon)
export const BriefcaseBusiness = createIcon(BriefcaseBusinessIcon)
export const Building2 = createIcon(Building2Icon)
export const CalendarDays = createIcon(CalendarDaysIcon)
export const CalendarPlus = createIcon(CalendarPlusIcon)
export const Check = createIcon(Tick01Icon)
export const ChevronDown = createIcon(ChevronDownIcon)
export const ChevronLeft = createIcon(ChevronLeftIcon)
export const ChevronRight = createIcon(ChevronRightIcon)
export const ChevronsUpDown = createIcon(ArrowUpDownIcon)
export const Circle = createIcon(CircleIcon)
export const CircleAlert = createIcon(AlertCircleIcon)
export const CircleHelp = createIcon(HelpCircleIcon)
export const Contact = createIcon(ContactIcon)
export const ExternalLink = createIcon(ExternalLinkIcon)
export const Eye = createIcon(ViewIcon)
export const FileText = createIcon(File01Icon)
export const Folder = createIcon(FolderIcon)
export const FolderKanban = createIcon(FolderKanbanIcon)
export const FolderPlus = createIcon(FolderAddIcon)
export const Heart = createIcon(FavouriteIcon)
export const Home = createIcon(Home01Icon)
export const ImageOff = createIcon(ImageNotFound01Icon)
export const Inbox = createIcon(InboxIcon)
export const Lock = createIcon(LockIcon)
export const Mail = createIcon(Mail01Icon)
export const MapPin = createIcon(MapPinIcon)
export const Menu = createIcon(Menu01Icon)
export const MessageSquareReply = createIcon(MessageCircleReplyIcon)
export const MessageSquareText = createIcon(MessageCircleReplyIcon)
export const Minus = createIcon(MinusSignIcon)
export const MoreHorizontal = createIcon(MoreHorizontalIcon)
export const MousePointerClick = createIcon(CursorPointer01Icon)
export const Newspaper = createIcon(NewsIcon)
export const Pencil = createIcon(PencilEdit01Icon)
export const Phone = createIcon(TelephoneIcon)
export const Pin = createIcon(PinIcon)
export const PinOff = createIcon(PinOffIcon)
export const Plus = createIcon(PlusSignIcon)
export const RotateCcw = createIcon(ReloadIcon)
export const Search = createIcon(Search01Icon)
export const Send = createIcon(SentIcon)
export const Settings = createIcon(Settings01Icon)
export const Settings2 = createIcon(Settings02Icon)
export const Share2 = createIcon(Share01Icon)
export const SlidersHorizontal = createIcon(FilterHorizontalIcon)
export const Sparkles = createIcon(SparklesIcon)
export const Star = createIcon(StarIcon)
export const ThumbsUp = createIcon(ThumbsUpIcon)
export const Trash2 = createIcon(Delete02Icon)
export const UserRound = createIcon(UserIcon)
export const Users = createIcon(UserGroupIcon)
export const UsersRound = createIcon(UserMultiple02Icon)
export const WalletCards = createIcon(WalletCardsIcon)
export const X = createIcon(Cancel01Icon)
