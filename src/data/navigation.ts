// src/data/navigation.ts
// Single source of truth for all navigation items.
// Used by both DesktopNav and MobileMenu.

export interface NavItem {
  label: string;
  href: string;
}

export const navigationItems: NavItem[] = [
  { label: 'Karte', href: '#karte' },
  { label: 'Konzept', href: '#konzept' },
  { label: 'Begegnungen', href: '#begegnungen' },
  { label: 'Events', href: '#events' },
  { label: 'Member', href: '#member' },
  { label: 'Reservierung', href: '#reservierung' },
];
