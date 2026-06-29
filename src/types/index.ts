export type AccountType = 'BANK' | 'CREDIT_CARD' | 'CASH' | 'SAVINGS' | 'INVESTMENT' | 'LOAN'
export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER'
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PAYMENT'
export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER' | 'OTHER'
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'ANNUAL'
export type GoalType = 'SAVINGS' | 'DEBT_PAYMENT' | 'PURCHASE'
export type ReminderType = 'PAYMENT' | 'CUT_DATE' | 'CUSTOM'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Cuenta bancaria',
  CREDIT_CARD: 'Tarjeta de crédito',
  CASH: 'Efectivo',
  SAVINGS: 'Ahorro',
  INVESTMENT: 'Inversión',
  LOAN: 'Crédito / Deuda',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  DEBT_PAYMENT: 'Pago de deuda',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  DEBIT_CARD: 'Tarjeta débito',
  CREDIT_CARD: 'Tarjeta crédito',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
}
