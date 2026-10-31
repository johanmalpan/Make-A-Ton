export type PaymentMethod = 'UPI' | 'NetBanking' | 'CreditCard' | 'DebitCard' | 'NEFT_RTGS' | 'Cheque';
export type PaymentStatus = 'succeeded' | 'processing' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerCompany: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNumber: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
}
