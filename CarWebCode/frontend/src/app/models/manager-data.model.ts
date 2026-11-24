export const MANAGER_TABLES = [
  {
    key: 'stock-movements',
    title: 'Stock movements',
    description: 'Review all vehicle and spare part inventory movements.',
    icon: 'fa-right-left',
  },
  {
    key: 'appointments',
    title: 'Appointments',
    description: 'View customer appointments and their current status.',
    icon: 'fa-calendar-check',
  },
  {
    key: 'test-drives',
    title: 'Test drives',
    description: 'Review scheduled and completed test drives.',
    icon: 'fa-car-side',
  },
  {
    key: 'inspections',
    title: 'Inspections',
    description: 'View vehicle inspection findings and results.',
    icon: 'fa-clipboard-check',
  },
  {
    key: 'trades',
    title: 'Trades',
    description: 'Review purchase and sale transactions.',
    icon: 'fa-handshake',
  },
  {
    key: 'documents',
    title: 'Documents',
    description: 'View documents associated with each trade.',
    icon: 'fa-folder-open',
  },
  {
    key: 'contracts',
    title: 'Contracts',
    description: 'Review contracts generated for trades.',
    icon: 'fa-file-signature',
  },
  {
    key: 'receipts',
    title: 'Receipts',
    description: 'View receipts issued for completed trades.',
    icon: 'fa-receipt',
  },
] as const;

export type ManagerTableKey = (typeof MANAGER_TABLES)[number]['key'];

export interface ManagerTableData {
  table: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}
