/** Happilo receivables summary used by the executive board (dummy data). Figures come from the same party ledger as the Accounts Receivable screens. */
import { getPartyBalances } from './receivables';

export interface Invoice {
  invNo: string;
  amount: number;
  date: string;
}

export interface Receivable {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  outstanding: number;
  overdueDays: number;
  lastReminder: string;
  stage: string;
  invoices: Invoice[];
}

/** The six largest overdue balances. */
export const INITIAL_RECEIVABLES: Receivable[] = getPartyBalances()
  .filter((p) => p.overdueDays > 0)
  .slice(0, 40)
  .map((p, i) => ({ id: `rec-${i + 1}`, ...p }));
