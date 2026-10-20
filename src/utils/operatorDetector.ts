import { Operator } from '../types';

export interface OperatorInfo {
  name: Operator;
  color: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
  gradient: string;
  prefix: string[];
}

export const OPERATORS: Record<string, OperatorInfo> = {
  Telkomsel: {
    name: 'Telkomsel',
    color: '#E11D48',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'text-red-600',
    gradient: 'from-red-600 to-rose-700',
    prefix: ['0811', '0812', '0813', '0821', '0822', '0823', '0852', '0853', '0851'],
  },
  Indosat: {
    name: 'Indosat',
    color: '#EAB308',
    badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    badgeText: 'text-yellow-600',
    gradient: 'from-amber-500 to-yellow-600',
    prefix: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
  },
  XL: {
    name: 'XL',
    color: '#2563EB',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'text-blue-600',
    gradient: 'from-blue-600 to-indigo-700',
    prefix: ['0817', '0818', '0819', '0859', '0877', '0878'],
  },
  Axis: {
    name: 'Axis',
    color: '#9333EA',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-600',
    gradient: 'from-purple-600 to-fuchsia-700',
    prefix: ['0831', '0832', '0833', '0838'],
  },
  Tri: {
    name: 'Tri',
    color: '#EA580C',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeText: 'text-orange-600',
    gradient: 'from-orange-500 to-red-600',
    prefix: ['0895', '0896', '0897', '0898', '0899'],
  },
  Smartfren: {
    name: 'Smartfren',
    color: '#DB2777',
    badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
    badgeText: 'text-pink-600',
    gradient: 'from-pink-600 to-rose-600',
    prefix: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
  },
};

export function detectOperator(phone: string): OperatorInfo | null {
  if (!phone) return null;
  // Normalize phone to format starting with 08
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) {
    clean = '0' + clean.slice(2);
  }

  if (clean.length < 4) return null;

  const prefix4 = clean.slice(0, 4);

  for (const opKey in OPERATORS) {
    const op = OPERATORS[opKey];
    if (op.prefix.includes(prefix4)) {
      return op;
    }
  }

  return null;
}
