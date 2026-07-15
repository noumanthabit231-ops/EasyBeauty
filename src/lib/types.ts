export type Role = 'owner' | 'super_admin';
export type SubStatus = 'trial' | 'active' | 'expired';

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

export interface CartItem {
  product: Product;
  qty: number;
}
