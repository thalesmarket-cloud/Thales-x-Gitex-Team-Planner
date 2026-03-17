/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  Users, 
  CalendarDays, 
  Plus, 
  Download, 
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Trash2,
  Edit2,
  X,
  LayoutDashboard,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

import { TeamMember, Assignment, Role, PoloSize } from './types';
import { SAMPLE_MEMBERS, SHIFTS, EVENT_DAYS, ROLES, MEMBER_COLORS, POLO_SIZES } from './constants';
import { cn } from './lib/utils';

// --- Components ---

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: string | number, icon: any, colorClass: string }) => (
  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", colorClass)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

// --- Main App ---

export default function App() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditingMember, setIsEditingMember] = useState<TeamMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    localStorage.setItem('gitex-members', JSON.stringify(members));
    localStorage.setItem('gitex-assignments', JSON.stringify(assignments));
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleDeleteMember = (member: TeamMember) => {
    setMembers(prev => prev.filter(m => m.id !== member.id));
    setAssignments(prev => prev.filter(a => a.memberId !== member.id));
    setMemberToDelete(null);
  };

  // Initialize state
  useEffect(() => {
    const savedMembers = localStorage.getItem('gitex-members');
    const savedAssignments = localStorage.getItem('gitex-assignments');

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    } else {
      setMembers(SAMPLE_MEMBERS);
    }

    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem('gitex-members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('gitex-assignments', JSON.stringify(assignments));
  }, [assignments]);

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const memberId = active.id as string;
    const shiftId = over.id as string;

    if (shiftId.includes('-')) {
      const exists = assignments.some(a => a.memberId === memberId && a.shiftId === shiftId);
      if (exists) return;
      setAssignments(prev => [...prev, { memberId, shiftId }]);
    }
  };

  const removeAssignment = (memberId: string, shiftId: string) => {
    setAssignments(prev => prev.filter(a => !(a.memberId === memberId && a.shiftId === shiftId)));
  };

  const resetPlanning = () => {
    if (confirm('Are you sure you want to reset all shift assignments?')) {
      setAssignments([]);
    }
  };

  const exportCSV = () => {
    let csv = 'Date,Shift,Member,Role,Email\n';
    SHIFTS.forEach(shift => {
      const shiftAssignments = assignments.filter(a => a.shiftId === shift.id);
      shiftAssignments.forEach(a => {
        const member = members.find(m => m.id === a.memberId);
        if (member) {
          csv += `${shift.date},${shift.type},"${member.name}","${member.role}","${member.email}"\n`;
        }
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'gitex_planning.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Stats
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const assignedShifts = new Set(assignments.map(a => a.shiftId)).size;
    const totalShifts = SHIFTS.length;
    const emptyShifts = totalShifts - assignedShifts;
    
    return { totalMembers, assignedShifts, emptyShifts };
  }, [members, assignments]);

  const unassignedMembers = useMemo(() => {
    return members.filter(m => !assignments.some(a => a.memberId === m.id));
  }, [members, assignments]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <CalendarDays className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">GITEX Team Planner</h1>
              <p className="text-slate-500 text-sm font-medium">GITEX Africa Morocco 2026 • April 7-9</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-semibold text-sm shadow-lg shadow-emerald-200"
            >
              <Save size={18} />
              <span>Sauvegarder</span>
            </button>
            <button 
              onClick={resetPlanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all font-semibold text-sm"
            >
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all font-semibold text-sm"
            >
              <Download size={18} />
              <span>PDF</span>
            </button>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-semibold text-sm shadow-lg shadow-indigo-200"
            >
              <Download size={18} />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Dashboard Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total Team Members" 
            value={stats.totalMembers} 
            icon={Users} 
            colorClass="bg-blue-500" 
          />
          <StatCard 
            label="Assigned Shifts" 
            value={stats.assignedShifts} 
            icon={CheckCircle2} 
            colorClass="bg-emerald-500" 
          />
          <StatCard 
            label="Remaining Shifts" 
            value={stats.emptyShifts} 
            icon={AlertCircle} 
            colorClass="bg-amber-500" 
          />
        </section>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Planning Board (Left) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays size={24} className="text-indigo-600" />
                    Planning Board
                  </h2>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      <Clock size={14} />
                      <span>09:00 - 18:00</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {EVENT_DAYS.map(date => (
                    <div key={date} className="space-y-4">
                      <div className="text-center pb-4 border-b border-slate-100">
                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                          {format(parseISO(date), 'EEEE')}
                        </div>
                        <div className="text-base font-bold text-slate-900">
                          {format(parseISO(date), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      {['Morning', 'Afternoon'].map(type => {
                        const shift = SHIFTS.find(s => s.date === date && s.type === type)!;
                        const shiftAssignments = assignments.filter(a => a.shiftId === shift.id);
                        const isUnderstaffed = shiftAssignments.length < 2;

                        return (
                          <ShiftDropZone 
                            key={shift.id} 
                            shift={shift} 
                            assignments={shiftAssignments}
                            members={members}
                            onRemove={removeAssignment}
                            isUnderstaffed={isUnderstaffed}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Unassigned Members Alert */}
              {unassignedMembers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {unassignedMembers.length} member{unassignedMembers.length > 1 ? 's' : ''} not assigned yet
                    </p>
                    <p className="text-xs text-amber-700">Make sure everyone has at least one shift for full coverage.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Team Management (Right) */}
            <div className="lg:col-span-4 space-y-6 sticky top-32 self-start">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users size={24} className="text-indigo-600" />
                    Team
                  </h2>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                  {members.map(member => (
                    <div key={member.id} className="group relative">
                      <DraggableMember member={member} />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsEditingMember(member); }}
                          className="p-1.5 rounded-lg bg-white/90 shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMemberToDelete(member); }}
                          className="p-1.5 rounded-lg bg-white/90 shadow-sm text-slate-600 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Users size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No team members yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-100">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Clock size={18} />
                  Event Schedule
                </h3>
                <div className="space-y-3 text-sm opacity-90">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Opening Day</span>
                    <span className="font-bold">Apr 07</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Full Exhibition</span>
                    <span className="font-bold">Apr 08</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closing Ceremony</span>
                    <span className="font-bold">Apr 09</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className={cn(
                "p-3 rounded-xl text-white font-medium shadow-2xl scale-105 cursor-grabbing",
                members.find(m => m.id === activeId)?.color
              )}>
                {members.find(m => m.id === activeId)?.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modals */}
      <MemberModal 
        isOpen={showAddModal || !!isEditingMember} 
        onClose={() => {
          setShowAddModal(false);
          setIsEditingMember(null);
        }}
        onSave={(member) => {
          if (isEditingMember) {
            setMembers(prev => prev.map(m => m.id === member.id ? member : m));
          } else {
            setMembers(prev => [...prev, member]);
          }
          setShowAddModal(false);
          setIsEditingMember(null);
        }}
        initialData={isEditingMember || undefined}
      />

      <DeleteModal 
        member={memberToDelete} 
        onClose={() => setMemberToDelete(null)} 
        onConfirm={() => memberToDelete && handleDeleteMember(memberToDelete)} 
      />

      {/* Save Success Notification */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
            <span className="font-bold text-sm">Avancement sauvegardé avec succès !</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

import { useDraggable, useDroppable } from '@dnd-kit/core';

interface DraggableMemberProps {
  key?: React.Key;
  member: TeamMember;
}

function DraggableMember({ member }: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: member.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-4 rounded-2xl border border-slate-100 bg-white flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-indigo-100",
        isDragging && "opacity-50 grayscale shadow-none"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm", member.color)}>
        {member.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-900 truncate">{member.name}</div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{member.role}</div>
          {member.poloSize && (
            <div className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
              {member.poloSize}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ShiftDropZoneProps {
  key?: React.Key;
  shift: import('./types').Shift;
  assignments: Assignment[];
  members: TeamMember[];
  onRemove: (mid: string, sid: string) => void;
  isUnderstaffed: boolean;
}

function ShiftDropZone({ 
  shift, 
  assignments, 
  members, 
  onRemove,
  isUnderstaffed
}: ShiftDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: shift.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[160px] rounded-2xl border-2 border-dashed p-4 transition-all duration-200 flex flex-col gap-3",
        isOver ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-slate-50/50",
        isUnderstaffed && !isOver && "border-amber-200 bg-amber-50/30"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shift.type}</span>
          <span className="text-[10px] text-slate-400 font-medium">{shift.startTime} - {shift.endTime}</span>
        </div>
        {isUnderstaffed && (
          <div className="group relative">
            <AlertCircle size={14} className="text-amber-500" />
            <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              Understaffed: Need at least 2 people.
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        {assignments.map(a => {
          const member = members.find(m => m.id === a.memberId);
          if (!member) return null;
          return (
            <motion.div 
              layoutId={`${shift.id}-${member.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={member.id} 
              className={cn("p-2.5 rounded-xl text-white text-xs font-bold flex justify-between items-center shadow-sm", member.color)}
            >
              <span className="truncate">{member.name}</span>
              <button 
                onClick={() => onRemove(member.id, shift.id)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
        {assignments.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
            Available
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteModal({ member, onClose, onConfirm }: { member: TeamMember | null, onClose: () => void, onConfirm: () => void }) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Member?</h3>
          <p className="text-slate-500 mb-8 text-sm">
            Are you sure you want to remove <span className="text-slate-900 font-bold">{member.name}</span>? 
            This will also remove all their shift assignments.
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-lg shadow-rose-200 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MemberModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (m: TeamMember) => void,
  initialData?: TeamMember
}) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    role: 'Commercial',
    poloSize: 'L',
    phone: '',
    email: '',
    color: MEMBER_COLORS[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        role: 'Commercial',
        poloSize: 'L',
        phone: '',
        email: '',
        color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...formData as TeamMember,
            id: initialData?.id || Math.random().toString(36).substr(2, 9)
          });
        }}>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Amine Benali"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taille du polo</label>
              <select 
                value={formData.poloSize}
                onChange={e => setFormData(prev => ({ ...prev, poloSize: e.target.value as PoloSize }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {POLO_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Color</label>
            <div className="flex gap-2 flex-wrap pt-2">
              {MEMBER_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    color,
                    formData.color === color ? "ring-2 ring-indigo-600 ring-offset-2 scale-110" : "opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="+212 600-000000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
            <input 
              required
              type="email" 
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="amine@gitex.ma"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 mt-4"
          >
            {initialData ? 'Update Member' : 'Add Member'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
