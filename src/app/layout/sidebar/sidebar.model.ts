export interface NavItem {
  label: string;
  route: string;
  icon: string;
  module: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
