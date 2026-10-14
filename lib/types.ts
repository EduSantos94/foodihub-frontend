export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  amount: number;
  category_id?: string;
  active: boolean;
}

export interface ProductSize {
  id: string;
  product_id: string;
  name: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Supply {
  id: string;
  name: string;
  type: 'ingredient' | 'packaging' | 'cleaning' | 'other';
  unit_measure: string;
  amount: number;
  description?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  city?: string;
  state?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  city?: string;
  state?: string;
  active: boolean;
}

export type SaleStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
export type DeliveryType = 'takeout' | 'delivery' | 'dine_in';

export interface SaleItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface Sale {
  id: string;
  customer_id?: string;
  sale_number?: string;
  sale_date: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  status: SaleStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  items?: SaleItem[];
}

export const DELIVERY_LABEL: Record<DeliveryType, string> = { takeout: 'Retirada', delivery: 'Entrega', dine_in: 'No local' };
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  pix: 'Pix',
  bank_transfer: 'Transferência',
};
export const STATUS_LABEL: Record<SaleStatus, string> = {
  pending: 'Pendente',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = { pending: 'A receber', paid: 'Pago', cancelled: 'Cancelado' };
