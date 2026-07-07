'use client';

// Single semantic icon registry (Phosphor). Always reference icons by semantic
// name so the visual language stays consistent — never import Phosphor
// components directly in feature code.

import {
  ArrowLeft,
  BookmarkSimple,
  Check,
  CheckCircle,
  CircleNotch,
  Compass,
  Crown,
  Drop,
  FunnelSimple,
  ListBullets,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Mountains,
  NavigationArrow,
  PaperPlaneTilt,
  Plus,
  SealCheck,
  Thermometer,
  User,
  UsersThree,
  Warning,
  Waves,
  X,
  XCircle,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

export type IconName =
  | 'cave'
  | 'waterfall'
  | 'hot_spring'
  | 'spring'
  | 'other'
  | 'map'
  | 'list'
  | 'search'
  | 'filter'
  | 'save'
  | 'visited'
  | 'directions'
  | 'warning'
  | 'verified'
  | 'community'
  | 'report'
  | 'submit'
  | 'user'
  | 'premium'
  | 'compass'
  | 'pin'
  | 'back'
  | 'close'
  | 'plus'
  | 'check'
  | 'approve'
  | 'reject'
  | 'spinner';

const REGISTRY: Record<IconName, PhosphorIcon> = {
  cave: Mountains,
  waterfall: Waves,
  hot_spring: Thermometer,
  spring: Drop,
  other: MapPin,
  map: MapTrifold,
  list: ListBullets,
  search: MagnifyingGlass,
  filter: FunnelSimple,
  save: BookmarkSimple,
  visited: CheckCircle,
  directions: NavigationArrow,
  warning: Warning,
  verified: SealCheck,
  community: UsersThree,
  report: PaperPlaneTilt,
  submit: Plus,
  user: User,
  premium: Crown,
  compass: Compass,
  pin: MapPin,
  back: ArrowLeft,
  close: X,
  plus: Plus,
  check: Check,
  approve: CheckCircle,
  reject: XCircle,
  spinner: CircleNotch,
};

export function Icon({
  name,
  size = 20,
  weight = 'regular',
  className,
}: {
  name: IconName;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
}) {
  const Component = REGISTRY[name];
  return <Component size={size} weight={weight} className={className} aria-hidden />;
}
