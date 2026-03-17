export type Role = 'Directeur Général' | 'Directeur Commercial' | 'Commercial' | 'Marketing' | 'Consultant';

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  phone: string;
  email: string;
  color: string;
}

export type ShiftType = 'Morning' | 'Afternoon';

export interface Shift {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  type: ShiftType;
  startTime: string;
  endTime: string;
}

export interface Assignment {
  memberId: string;
  shiftId: string;
}

export interface AppState {
  members: TeamMember[];
  assignments: Assignment[];
}
