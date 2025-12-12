
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Student, AcademicClass, Term, StudentSubjectEnrollment } from '../../types';
import Spinner from '../common/Spinner';
import { SearchIcon, CheckCircleIcon, XCircleIcon } from '../common/icons';

interface StudentSubjectEnrollmentManagerProps {
  schoolId: number;
  students: Student[];
  allSubjects: { id: number; name: string }[];
  academicClasses: AcademicClass[];
  terms: Term[];
  studentSubjectEnrollments: StudentSubjectEnrollment[];
  onRefreshData: () => Promise<void>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StudentSubjectEnrollmentManager: React.FC<StudentSubjectEnrollmentManagerProps> = ({ 
  schoolId,
  students,
  allSubjects,
  academicClasses,
  terms,
  studentSubjectEnrollments,
  onRefreshData,
  addToast 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAcademicClassId, setSelectedAcademicClassId] = useState<number | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classSubjects, setClassSubjects] = useState<{ id: number; name: string }[]>([]);

  // Get the current term (most recent active term)
  useEffect(() => {
    if (terms.length > 0 && !selectedTermId) {
      const sortedTerms = [...terms].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setSelectedTermId(sortedTerms[0]?.id || null);
    }
  }, [terms, selectedTermId]);

  // Get active academic classes for selected term
  const activeAcademicClasses = useMemo(() => {
    return academicClasses.filter(ac => ac.is_active);
  }, [academicClasses]);

  // Get students to show for the selected academic class and term
  // Note: This shows all students in the school. In production, you may want to
  // filter by academic_class_students to only show students enrolled in the selected class.
  const enrolledStudents = useMemo(() => {
    if (!selectedAcademicClassId || !selectedTermId) return [];
    
    return students.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedAcademicClassId, selectedTermId]);

  // Get subjects for the selected class
  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!selectedAcademicClassId) {
        setClassSubjects([]);
        return;
      }

      try {
        setIsLoading(true);
        // Get the academic class to extract level
        const selectedClass = academicClasses.find(ac => ac.id === selectedAcademicClassId);
        if (!selectedClass) return;

        // Extract the level from the class name (e.g., "JSS 1" from "JSS 1 Gold (2023/2024)")
        const level = selectedClass.level;

        // Find the base class ID
        const { data: baseClassData } = await supabase
          .from('classes')
          .select('id, name')
          .eq('school_id', schoolId)
          .eq('name', level)
          .single();

        if (!baseClassData) {
          setClassSubjects(allSubjects);
          return;
        }

        // Get subjects for this class
        const { data: csData } = await supabase
          .from('class_subjects')
          .select('subject_id')
          .eq('class_id', baseClassData.id);

        if (csData && csData.length > 0) {
          const subjectIds = csData.map(cs => cs.subject_id);
          const subjects = allSubjects.filter(s => subjectIds.includes(s.id));
          setClassSubjects(subjects);
        } else {
          // If no class subjects defined, show all subjects
          setClassSubjects(allSubjects);
        }
      } catch (error) {
        console.error('Error fetching class subjects:', error);
        setClassSubjects(allSubjects);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassSubjects();
  }, [selectedAcademicClassId, academicClasses, allSubjects, schoolId]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return enrolledStudents;
    const term = searchTerm.toLowerCase();
    return enrolledStudents.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.admission_number?.toLowerCase().includes(term)
    );
  }, [enrolledStudents, searchTerm]);

  // Check if a student is enrolled in a subject
  const isEnrolled = useCallback((studentId: number, subjectId: number) => {
    if (!selectedAcademicClassId || !selectedTermId) return false;
    
    const enrollment = studentSubjectEnrollments.find(sse =>
      sse.student_id === studentId &&
      sse.subject_id === subjectId &&
      sse.academic_class_id === selectedAcademicClassId &&
      sse.term_id === selectedTermId
    );
    
    return enrollment?.is_enrolled ?? false;
  }, [studentSubjectEnrollments, selectedAcademicClassId, selectedTermId]);

  // Toggle enrollment for a student-subject combination
  const toggleEnrollment = async (studentId: number, subjectId: number) => {
    if (!selectedAcademicClassId || !selectedTermId) {
      addToast('Please select an academic class and term', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const currentEnrollment = studentSubjectEnrollments.find(sse =>
        sse.student_id === studentId &&
        sse.subject_id === subjectId &&
        sse.academic_class_id === selectedAcademicClassId &&
        sse.term_id === selectedTermId
      );

      const newEnrollmentStatus = !isEnrolled(studentId, subjectId);

      if (currentEnrollment) {
        // Update existing record - timestamp updated automatically by database
        const { error } = await supabase
          .from('student_subject_enrollments')
          .update({ 
            is_enrolled: newEnrollmentStatus
          })
          .eq('id', currentEnrollment.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('student_subject_enrollments')
          .insert({
            school_id: schoolId,
            student_id: studentId,
            subject_id: subjectId,
            academic_class_id: selectedAcademicClassId,
            term_id: selectedTermId,
            is_enrolled: newEnrollmentStatus
          });

        if (error) throw error;
      }

      await onRefreshData();
      addToast(`Enrollment ${newEnrollmentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling enrollment:', error);
      addToast('Failed to update enrollment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk enroll/unenroll all students for a subject
  const bulkToggleSubject = async (subjectId: number, enroll: boolean) => {
    if (!selectedAcademicClassId || !selectedTermId) {
      addToast('Please select an academic class and term', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const updates = filteredStudents.map(student => ({
        school_id: schoolId,
        student_id: student.id,
        subject_id: subjectId,
        academic_class_id: selectedAcademicClassId,
        term_id: selectedTermId,
        is_enrolled: enroll
      }));

      // Use upsert to ensure atomicity - timestamps handled by database
      const { error } = await supabase
        .from('student_subject_enrollments')
        .upsert(updates, {
          onConflict: 'student_id,subject_id,academic_class_id,term_id'
        });

      if (error) throw error;

      await onRefreshData();
      addToast(`All students ${enroll ? 'enrolled' : 'unenrolled'} successfully`, 'success');
    } catch (error) {
      console.error('Error bulk toggling enrollment:', error);
      addToast('Failed to update enrollments', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (activeAcademicClasses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">No active academic classes found. Please create academic classes first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Subject Enrollment</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Manage which students are enrolled in which subjects for each class and term.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Academic Class
            </label>
            <select
              value={selectedAcademicClassId || ''}
              onChange={(e) => setSelectedAcademicClassId(Number(e.target.value) || null)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class...</option>
              {activeAcademicClasses.map(ac => (
                <option key={ac.id} value={ac.id}>{ac.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Term
            </label>
            <select
              value={selectedTermId || ''}
              onChange={(e) => setSelectedTermId(Number(e.target.value) || null)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a term...</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>
                  {t.session_label} - {t.term_label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Students
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or admission number..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Matrix */}
      {selectedAcademicClassId && selectedTermId ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
          {isLoading || isSaving ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-500/10 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold sticky left-0 bg-slate-500/10 z-10">
                      Student
                    </th>
                    {classSubjects.map(subject => (
                      <th key={subject.id} className="px-4 py-3 text-center font-semibold">
                        <div className="flex flex-col items-center space-y-2">
                          <span className="max-w-[120px] truncate" title={subject.name}>
                            {subject.name}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => bulkToggleSubject(subject.id, true)}
                              className="px-2 py-1 text-xs bg-green-500/20 text-green-800 dark:text-green-300 rounded hover:bg-green-500/30"
                              title="Enroll all"
                            >
                              All ✓
                            </button>
                            <button
                              onClick={() => bulkToggleSubject(subject.id, false)}
                              className="px-2 py-1 text-xs bg-red-500/20 text-red-800 dark:text-red-300 rounded hover:bg-red-500/30"
                              title="Unenroll all"
                            >
                              None ✗
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={classSubjects.length + 1} className="px-6 py-8 text-center text-slate-500">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-500/5">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white sticky left-0 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
                          <div>
                            <div className="font-semibold">{student.name}</div>
                            {student.admission_number && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {student.admission_number}
                              </div>
                            )}
                          </div>
                        </td>
                        {classSubjects.map(subject => {
                          const enrolled = isEnrolled(student.id, subject.id);
                          return (
                            <td key={subject.id} className="px-4 py-4 text-center">
                              <button
                                onClick={() => toggleEnrollment(student.id, subject.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  enrolled
                                    ? 'bg-green-500/20 text-green-800 dark:text-green-300 hover:bg-green-500/30'
                                    : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-400 hover:bg-slate-300/60 dark:hover:bg-slate-600/60'
                                }`}
                                title={enrolled ? 'Click to unenroll' : 'Click to enroll'}
                              >
                                {enrolled ? (
                                  <CheckCircleIcon className="w-5 h-5" />
                                ) : (
                                  <XCircleIcon className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-12 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Please select an academic class and term to manage enrollments.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">ℹ️ How it works</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Select an academic class and term to view and manage student enrollments</li>
          <li>Click on checkboxes to toggle individual student enrollments for subjects</li>
          <li>Use "All ✓" or "None ✗" buttons to quickly enroll/unenroll all students for a subject</li>
          <li>If no enrollment records exist for a subject, teachers will see all class students (backward compatible)</li>
          <li>Once enrollment records exist, teachers will only see students with enrollment enabled</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentSubjectEnrollmentManager;
