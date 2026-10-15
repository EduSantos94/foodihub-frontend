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

export interface Store {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  active: boolean;
}

export type PurchasePaymentStatus = 'pending' | 'partial' | 'paid' | 'cancelled';
export type PurchasePaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix' | 'other';

export interface PurchaseItem {
  id: string;
  supply_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_number?: string;
  expiry_date?: string;
}

export interface Purchase {
  id: string;
  supplier_id: string;
  purchase_number?: string;
  purchase_date: string;
  invoice_number?: string;
  total_amount: number;
  paid_amount: number;
  payment_status: PurchasePaymentStatus;
  payment_method?: PurchasePaymentMethod;
  notes?: string;
  items?: PurchaseItem[];
}

export const PURCHASE_PAYMENT_STATUS_LABEL: Record<PurchasePaymentStatus, string> = {
  pending: 'A pagar',
  partial: 'Parcial',
  paid: 'Pago',
  cancelled: 'Cancelado',
};
export const PURCHASE_PAYMENT_LABEL: Record<PurchasePaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  bank_transfer: 'Transferência',
  pix: 'Pix',
  other: 'Outro',
};

export interface StoreUser {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff';
  active: boolean;
}

export const ROLE_LABEL: Record<string, string> = { admin: 'Administrador', manager: 'Gerente', staff: 'Equipe' };

export type IntegrationType = 'ifood' | 'aiqfome' | 'custom';
export type IntegrationStatus = 'active' | 'inactive' | 'error';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  has_api_key: boolean;
  has_api_secret: boolean;
  webhook_url?: string;
  status: IntegrationStatus;
  last_sync?: string;
  last_error?: string;
  active: boolean;
}

export interface Webhook {
  id: string;
  integration_id: string;
  event_type: string;
  endpoint_url: string;
  active: boolean;
  max_retries: number;
}

export type WebhookEventStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'skipped';

export interface WebhookEvent {
  id: string;
  event_type: string;
  response_status?: number;
  response_body?: string;
  status: WebhookEventStatus;
  attempt_count: number;
  last_attempt?: string;
  next_retry?: string;
  created_at: string;
}

export const INTEGRATION_TYPE_LABEL: Record<IntegrationType, string> = { ifood: 'iFood', aiqfome: 'aiqfome', custom: 'Personalizada' };
export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = { active: 'Conectada', inactive: 'Inativa', error: 'Com erro' };
export const WEBHOOK_EVENT_LABEL: Record<string, string> = {
  'order.created': 'Pedido criado',
  'order.updated': 'Pedido atualizado',
  'order.cancelled': 'Pedido cancelado',
  'webhook.test': 'Teste',
};
export const EVENT_STATUS_LABEL: Record<WebhookEventStatus, string> = {
  pending: 'Na fila',
  sent: 'Enviando',
  delivered: 'Entregue',
  failed: 'Falhou',
  skipped: 'Ignorado',
};

export interface ReportOverview {
  period_days: number;
  summary: { total_sales: number; total_revenue: number; avg_ticket: number; cancelled_sales: number };
  sales_by_status: { status: SaleStatus; total_sales: number; total_revenue: number; avg_value: number }[];
  daily: { date: string; total_sales: number; revenue: number }[];
  top_products: { product_id: string; name: string; total_quantity: number; total_revenue: number; num_sales: number }[];
  low_stock_products: { id: string; name: string; amount: number }[];
  low_stock_supplies: { supply_id: string; name: string; unit_measure: string; amount: number; next_expiry_date?: string }[];
  integrations: { integration_id: string; name: string; type: IntegrationType; status: IntegrationStatus; pending_events: number; last_error?: string }[];
  webhook_errors: { id: string; integration_name: string; event_type: string; status: string; attempt_count: number; response_status?: number; created_at: string }[];
}
