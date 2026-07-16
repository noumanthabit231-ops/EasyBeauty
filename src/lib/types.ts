export type Role = 'owner' | 'super_admin';
export type SubStatus = 'active' | 'expired';

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  address: string;
  whatsapp: string;
  currency: string;
  logo_url: string;
  cover_url: string;
  button_color: string;
  text_on_button: string;
  font_family: string;
  bg_color: string;
  bg_image_url: string;
  title_font: string;
  title_color: string;
  title_size: number;
  logo_size: number;
  title_plate: boolean;
  about: string;
  show_map: boolean;
  is_active: boolean;
  subscription_status: SubStatus;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  parent_id: string | null;
  name: string;
  subtitle: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  image_url: string;
  badge: string;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface Promo {
  id: string;
  store_id: string;
  code: string;
  description: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  store_id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  created_at: string;
}

export type LinkKind =
  | 'whatsapp' | 'instagram' | 'tiktok' | 'telegram'
  | 'sale' | 'catalog' | 'loyalty' | 'wholesale' | 'custom';

export interface Link {
  id: string;
  store_id: string;
  kind: LinkKind;
  title: string;
  subtitle: string;
  url: string;
  highlight: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  total: number;
  items_count: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  qty: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}
