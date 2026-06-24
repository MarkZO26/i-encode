import React, { useState, useEffect } from 'react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// --- INTERFACES ---
interface Student {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
}

interface Section {
  id: string;
  sectionName: string;
  gradeLevel: string;
  students: Student[];
  studentsLoaded: boolean;
}

// --- HELPER: Kuhanin ang teacher_id mula sa JWT ---
const getTeacherId = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
};

const ClassroomManager: React.FC = () => {
  // --- STATES ---
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modals Toggle
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Form States: New Class
  const [newClassName, setNewClassName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('Grade 1');

  // Form States: New Student
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female'>('Male');

  // Derived State
  const activeSection = sections.find(s => s.id === activeSectionId);

  // --- FETCH SECTIONS ON MOUNT ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const teacher_id = getTeacherId(); // 👈 kuhanin sa token

        if (!teacher_id) {
          setError('Hindi mahanap ang teacher. Mag-login ulit.');
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API}/sections?teacher_id=${teacher_id}`); // 👈 filter by teacher
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();

        const mapped: Section[] = json.data.map((sec: any) => ({
          id: sec.id,
          sectionName: sec.section_name,
          gradeLevel: sec.grade_level,
          students: [],
          studentsLoaded: false,
        }));

        setSections(mapped);
      } catch (err) {
        setError('Hindi ma-load ang mga sections. Check ang backend.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, []);

  // --- HANDLERS ---

  // Pag-click ng Section sa Sidebar
  const handleSelectSection = async (sectionId: string) => {
    setActiveSectionId(sectionId);

    const section = sections.find(s => s.id === sectionId);
    if (section?.studentsLoaded) return;

    setIsStudentsLoading(true);
    try {
      const res = await fetch(`${API}/students/${sectionId}`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const json = await res.json();

      const students: Student[] = json.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        gender: s.gender,
      }));

      setSections(prev => prev.map(sec =>
        sec.id === sectionId
          ? { ...sec, students, studentsLoaded: true }
          : sec
      ));
    } catch (err) {
      setError('Hindi ma-load ang mga studyante.');
    } finally {
      setIsStudentsLoading(false);
    }
  };

  // Pagdagdag ng Section
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const teacher_id = getTeacherId();

    try {
      const res = await fetch(`${API}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_name: newClassName,
          grade_level: newGradeLevel,
          teacher_id,
        }),
      });

      if (!res.ok) throw new Error('Failed to create');
      const json = await res.json();

      const newSection: Section = {
        id: json.data.id,
        sectionName: json.data.section_name,
        gradeLevel: json.data.grade_level,
        students: [],
        studentsLoaded: true,
      };

      setSections(prev => [...prev, newSection]);
      setActiveSectionId(newSection.id);
      setNewClassName('');
      setNewGradeLevel('Grade 1');
      setIsClassModalOpen(false);
    } catch (err) {
      setError('Hindi ma-create ang section. Subukan ulit.');
    }
  };

  // Pagdagdag ng Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeSectionId) return;

    const teacher_id = getTeacherId();

    try {
      const res = await fetch(`${API}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName,
          gender: newStudentGender,
          section_id: activeSectionId,
          teacher_id,
        }),
      });

      if (!res.ok) throw new Error('Failed to create student');
      const json = await res.json();

      const newStudent: Student = {
        id: json.data.id,
        name: json.data.name,
        gender: json.data.gender,
      };

      setSections(prev => prev.map(sec =>
        sec.id === activeSectionId
          ? { ...sec, students: [...sec.students, newStudent] }
          : sec
      ));

      setNewStudentName('');
      setNewStudentGender('Male');
      setIsStudentModalOpen(false);
    } catch (err) {
      setError('Hindi ma-add ang studyante. Subukan ulit.');
    }
  };

  // Delete Section
  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      const res = await fetch(`${API}/sections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSections(prev => prev.filter(sec => sec.id !== id));
      if (activeSectionId === id) setActiveSectionId(null);
    } catch (err) {
      setError('Hindi ma-delete ang section. Subukan ulit.');
    }
  };

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>
        Loading classes...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>

      {/* --- ERROR BANNER --- */}
      {error && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 20px', borderRadius: '8px', zIndex: 2000, fontSize: '14px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#991b1b' }}>✕</button>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div style={sidebarStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '10px' }}>
          <h3 style={{ color: '#4338ca', margin: 0 }}>My Classes</h3>
          <button onClick={() => setIsClassModalOpen(true)} style={addSmallBtn}>+</button>
        </div>
        <div style={{ overflowY: 'auto' }}>
          {sections.length === 0 ? (
            <p style={{ padding: '0 20px', fontSize: '12px', color: '#94a3b8' }}>No classes yet.</p>
          ) : (
            sections.map(sec => (
              <div
                key={sec.id}
                onClick={() => handleSelectSection(sec.id)}
                style={{
                  ...sidebarItemStyle,
                  backgroundColor: activeSectionId === sec.id ? '#eef2ff' : 'transparent',
                  borderLeft: activeSectionId === sec.id ? '4px solid #4338ca' : '4px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{sec.sectionName}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{sec.gradeLevel}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }}
                    style={deleteBtnStyle}
                    title="Delete section"
                  >🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {activeSection ? (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0 }}>Section {activeSection.sectionName}</h1>
                <p style={{ color: '#64748b' }}>{activeSection.gradeLevel} | {activeSection.students.length} Total Students</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setViewMode('card')}
                    style={{
                      padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '13px',
                      backgroundColor: viewMode === 'card' ? '#4338ca' : '#fff',
                      color: viewMode === 'card' ? '#fff' : '#64748b',
                    }}
                  >⊞ Card</button>
                  <button
                    onClick={() => setViewMode('table')}
                    style={{
                      padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '13px',
                      backgroundColor: viewMode === 'table' ? '#4338ca' : '#fff',
                      color: viewMode === 'table' ? '#fff' : '#64748b',
                    }}
                  >☰ Table</button>
                </div>
                <button onClick={() => setIsStudentModalOpen(true)} style={addButtonStyle}>+ Add Student</button>
              </div>
            </div>

            <hr style={{ margin: '20px 0', border: '0.5px solid #e2e8f0' }} />

            {isStudentsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                Loading students...
              </div>
            ) : activeSection.students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <p>Walang estudyante sa class na ito. I-click ang "+ Add Student".</p>
              </div>
            ) : viewMode === 'card' ? (
              <div style={studentGridStyle}>
                {activeSection.students.map((student) => (
                  <div key={student.id} style={studentCardStyle}>
                    <div style={avatarStyle(student.gender)}>
                      {student.gender === 'Male' ? '👦' : '👧'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {student.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Gender</th>
                    <th style={thStyle}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSection.students.map((student, index) => (
                    <tr
                      key={student.id}
                      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}
                    >
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{student.gender === 'Male' ? '👦' : '👧'}</span>
                          <span style={{ fontWeight: 'bold' }}>{student.name}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                          backgroundColor: student.gender === 'Male' ? '#dbeafe' : '#fce7f3',
                          color: student.gender === 'Male' ? '#1d4ed8' : '#be185d',
                        }}>
                          {student.gender}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#9ca3af', fontSize: '12px' }}>{student.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
            <h2>Welcome, Teacher!</h2>
            <p>Pumili ng class sa sidebar o i-click ang "+" para mag-create ng bago.</p>
          </div>
        )}
      </div>

      {/* --- MODAL: ADD CLASS --- */}
      {isClassModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0 }}>Add New Class</h3>
            <form onSubmit={handleAddClass}>
              <label style={labelStyle}>Section Name</label>
              <input
                autoFocus required style={fullInputStyle}
                value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Mabini"
              />
              <label style={labelStyle}>Grade Level</label>
              <select style={fullInputStyle} value={newGradeLevel} onChange={(e) => setNewGradeLevel(e.target.value)}>
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsClassModalOpen(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" style={addButtonStyle}>Create Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD STUDENT --- */}
      {isStudentModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0 }}>Add Student to {activeSection?.sectionName}</h3>
            <form onSubmit={handleAddStudent}>
              <label style={labelStyle}>Full Name</label>
              <input
                autoFocus required style={fullInputStyle}
                value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Juan Dela Cruz"
              />
              <label style={labelStyle}>Gender</label>
              <select
                style={fullInputStyle}
                value={newStudentGender}
                onChange={(e) => setNewStudentGender(e.target.value as 'Male' | 'Female')}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsStudentModalOpen(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" style={addButtonStyle}>Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const sidebarStyle: React.CSSProperties = { width: '250px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '20px 0', display: 'flex', flexDirection: 'column' };
const sidebarItemStyle: React.CSSProperties = { padding: '12px 20px', cursor: 'pointer', transition: '0.2s', marginBottom: '4px' };
const addButtonStyle: React.CSSProperties = { backgroundColor: '#4338ca', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const addSmallBtn: React.CSSProperties = { width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: '#eef2ff', color: '#4338ca', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' };
const deleteBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.4, padding: '2px 4px' };
const studentGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' };
const studentCardStyle: React.CSSProperties = { backgroundColor: '#fff', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };
const avatarStyle = (gender: string): React.CSSProperties => ({ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: gender === 'Male' ? '#dbeafe' : '#fce7f3', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' });
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' };
const fullInputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px', boxSizing: 'border-box', outlineColor: '#4338ca' };
const cancelBtn: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' };
const thStyle: React.CSSProperties = { padding: '10px 16px', fontWeight: 'bold', color: '#475569', fontSize: '12px' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#1e293b' };

export default ClassroomManager;