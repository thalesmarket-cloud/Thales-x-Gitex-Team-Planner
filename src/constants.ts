import { Shift } from './types';

export const EVENT_DAYS = [
  '2026-04-07',
  '2026-04-08',
  '2026-04-09',
];

export const SHIFTS: Shift[] = EVENT_DAYS.flatMap((date) => [
  {
    id: `${date}-morning`,
    date,
    type: 'Morning',
    startTime: '09:00',
    endTime: '13:00',
  },
  {
    id: `${date}-afternoon`,
    date,
    type: 'Afternoon',
    startTime: '13:00',
    endTime: '18:00',
  },
]);

export const ROLES = ['Manager', 'Sales', 'Technical', 'Support', 'Marketing'];

export const MEMBER_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-orange-500',
];

export const SAMPLE_MEMBERS = [
  {
    id: '1',
    name: 'Amine Benali',
    role: 'Manager',
    phone: '+212 600-112233',
    email: 'amine@gitex.ma',
    color: 'bg-blue-500',
  },
  {
    id: '2',
    name: 'Sarah Mansouri',
    role: 'Sales',
    phone: '+212 600-445566',
    email: 'sarah@gitex.ma',
    color: 'bg-purple-500',
  },
  {
    id: '3',
    name: 'Youssef Idrisi',
    role: 'Technical',
    phone: '+212 600-778899',
    email: 'youssef@gitex.ma',
    color: 'bg-emerald-500',
  },
  {
    id: '4',
    name: 'Laila Kadiri',
    role: 'Marketing',
    phone: '+212 600-001122',
    email: 'laila@gitex.ma',
    color: 'bg-amber-500',
  },
  {
    id: '5',
    name: 'Mehdi Tazi',
    role: 'Support',
    phone: '+212 600-334455',
    email: 'mehdi@gitex.ma',
    color: 'bg-rose-500',
  },
  {
    id: '6',
    name: 'Zineb Alaoui',
    role: 'Sales',
    phone: '+212 600-667788',
    email: 'zineb@gitex.ma',
    color: 'bg-indigo-500',
  },
];
