import React, { useState, useEffect, useCallback } from 'react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// --- INTERFACES ---
interface Activity { id: string; score: number; hps: number; activity_index: number; }
interface QuarterData {
  writtenWorks: Activity[];
  performanceTasks: Activity[];
  exam: Activity | null;
}
interface StudentGrades {
  id: string;
  name: string;
  quarterData: QuarterData;
}
interface SectionGrades {
  id: string;
  sectionName: string;
  gradeLevel: string;
  students: StudentGrades[];
  studentsLoaded: boolean;
}

const getTeacherId = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch { return null; }
};

const QUARTERS = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

const Grades: React.FC = () => {
  const [sections, setSections] = useState<SectionGrades[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [gradingPeriod, setGradingPeriod] = useState('1st Quarter');
  const [viewType, setViewType] = useState<'card' | 'table'>('table');
  
  // Gagamitin natin ito para i-toggle ang visibility ng detalye ng bawat student card
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FETCH SECTIONS ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const teacher_id = getTeacherId();
        if (!teacher_id) { setError('Mag-login ulit.'); setIsLoading(false); return; }

        const res = await fetch(`${API}/sections?teacher_id=${teacher_id}`);
        const json = await res.json();

        const mapped: SectionGrades[] = (json.data || []).map((sec: any) => ({
          id: sec.id,
          sectionName: sec.section_name,
          gradeLevel: sec.grade_level,
          students: [],
          studentsLoaded: false,
        }));

        setSections(mapped);
        if (mapped.length > 0) setActiveSectionId(mapped[0].id);
      } catch (err) {
        console.error("Error fetching sections:", err);
        setError('Hindi ma-load ang sections.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSections();
  }, []);

  // --- FETCH STUDENTS + ACTIVITIES + GRADES ---
  const loadSectionData = useCallback(async (sectionId: string, quarter: string) => {
    setIsContentLoading(true);
    try {
      const studRes = await fetch(`${API}/students/${sectionId}`);
      const studJson = await studRes.json();
      const rawStudents = studJson.data || [];

      const actRes = await fetch(`${API}/grade-activities?section_id=${sectionId}&quarter=${encodeURIComponent(quarter)}`);
      const actJson = await actRes.json();
      const activities: any[] = actJson.data || [];

      const gradeRes = await fetch(`${API}/grades?section_id=${sectionId}&quarter=${encodeURIComponent(quarter)}`);
      const gradeJson = await gradeRes.json();
      const gradeRecords: any[] = gradeJson.data || [];

      const students: StudentGrades[] = rawStudents.map((s: any) => {
        const studentGrades = gradeRecords.filter(g => {
          const g_student_id = typeof g.student_id === 'object' ? g.student_id?.id : g.student_id;
          return String(g_student_id) === String(s.id);
        });

        const writtenWorks: Activity[] = activities
          .filter(a => a.type === 'writtenWorks')
          .map(a => {
            const found = studentGrades.find(g => {
              const g_activity_id = typeof g.activity_id === 'object' ? g.activity_id?.id : g.activity_id;
              return String(g_activity_id) === String(a.id);
            });
            return { id: a.id, score: found ? Number(found.score) : 0, hps: Number(a.hps), activity_index: Number(a.activity_index) };
          });

        const performanceTasks: Activity[] = activities
          .filter(a => a.type === 'performanceTasks')
          .map(a => {
            const found = studentGrades.find(g => {
              const g_activity_id = typeof g.activity_id === 'object' ? g.activity_id?.id : g.activity_id;
              return String(g_activity_id) === String(a.id);
            });
            return { id: a.id, score: found ? Number(found.score) : 0, hps: Number(a.hps), activity_index: Number(a.activity_index) };
          });

        const examActivity = activities.find(a => a.type === 'exam');
        const examGrade = examActivity ? studentGrades.find(g => {
          const g_activity_id = typeof g.activity_id === 'object' ? g.activity_id?.id : g.activity_id;
          return String(g_activity_id) === String(examActivity.id);
        }) : null;

        const exam: Activity | null = examActivity
          ? { id: examActivity.id, score: examGrade ? Number(examGrade.score) : 0, hps: Number(examActivity.hps), activity_index: 0 }
          : null;

        return { id: s.id, name: s.name || s.student_name || 'No Name', quarterData: { writtenWorks, performanceTasks, exam } };
      });

      setSections(prev => prev.map(sec =>
        sec.id === sectionId ? { ...sec, students, studentsLoaded: true } : sec
      ));
    } catch (err) {
      console.error("Error loading system data:", err);
      setError('Hindi ma-load ang data ng estudyante.');
    } finally {
      setIsContentLoading(false);
    }
  }, []);

  // --- AUTO LOAD ON SECTION/QUARTER CHANGE ---
  useEffect(() => {
    if (activeSectionId) loadSectionData(activeSectionId, gradingPeriod);
  }, [activeSectionId, gradingPeriod, loadSectionData]);

  // --- TOGGLE CARD VISIBILITY ---
  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  // --- ADD ACTIVITY ---
  const handleAddActivity = async (type: 'writtenWorks' | 'performanceTasks') => {
    if (!activeSectionId) return;
    const hpsInput = prompt(`Enter HPS for new ${type === 'writtenWorks' ? 'Written Work' : 'Performance Task'}:`, '20');
    if (!hpsInput) return;
    const hps = parseInt(hpsInput);
    if (isNaN(hps) || hps <= 0) return;

    const activeSection = sections.find(s => s.id === activeSectionId);
    const existing = activeSection?.students[0]?.quarterData[type] || [];
    const activity_index = existing.length;
    const teacher_id = getTeacherId();

    try {
      const res = await fetch(`${API}/grade-activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: activeSectionId,
          teacher_id,
          quarter: gradingPeriod,
          type,
          activity_index,
          hps,
        }),
      });
      const json = await res.json();
      const newActivity = json.data;

      setSections(prev => prev.map(sec => {
        if (sec.id !== activeSectionId) return sec;
        return {
          ...sec,
          students: sec.students.map(student => ({
            ...student,
            quarterData: {
              ...student.quarterData,
              [type]: [...student.quarterData[type], { id: newActivity.id, score: 0, hps, activity_index }]
            }
          }))
        };
      }));
    } catch (err) {
      console.error("Error adding activity:", err);
      setError('Hindi ma-add ang activity.');
    }
  };

  // --- ADD EXAM ACTIVITY ---
  const handleAddExam = async (hps: number) => {
    if (!activeSectionId) return;
    const teacher_id = getTeacherId();

    try {
      const res = await fetch(`${API}/grade-activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: activeSectionId,
          teacher_id,
          quarter: gradingPeriod,
          type: 'exam',
          activity_index: 0,
          hps,
        }),
      });
      const json = await res.json();
      const newActivity = json.data;

      setSections(prev => prev.map(sec => {
        if (sec.id !== activeSectionId) return sec;
        return {
          ...sec,
          students: sec.students.map(student => ({
            ...student,
            quarterData: {
              ...student.quarterData,
              exam: { id: newActivity.id, score: 0, hps, activity_index: 0 }
            }
          }))
        };
      }));
    } catch (err) {
      console.error("Error adding exam:", err);
      setError('Hindi ma-add ang exam.');
    }
  };

  // --- SCORE CHANGE ---
  const handleScoreChange = async (
    studentId: string,
    activityId: string,
    type: 'writtenWorks' | 'performanceTasks' | 'exam',
    index: number,
    newScore: string
  ) => {
    const score = newScore === '' ? 0 : parseFloat(newScore);

    setSections(prev => prev.map(sec => {
      if (sec.id !== activeSectionId) return sec;
      return {
        ...sec,
        students: sec.students.map(student => {
          if (student.id !== studentId) return student;
          if (type === 'exam') {
            return { ...student, quarterData: { ...student.quarterData, exam: { ...student.quarterData.exam!, score } } };
          }
          const updated = [...student.quarterData[type]];
          updated[index] = { ...updated[index], score };
          return { ...student, quarterData: { ...student.quarterData, [type]: updated } };
        })
      };
    }));

    try {
      await fetch(`${API}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          section_id: activeSectionId,
          activity_id: activityId,
          score: score,
        }),
      });
    } catch (err) {
      console.error("Error saving score to API:", err);
      setError('Hindi ma-save ang score.');
    }
  };

  // --- CALCULATE FINAL GRADE (DepEd 20/60/20) ---
  const calculateFinal = (student: StudentGrades) => {
    const { writtenWorks, performanceTasks, exam } = student.quarterData;

    const getWeighted = (list: Activity[], weight: number) => {
      const ts = list.reduce((a, b) => a + b.score, 0);
      const th = list.reduce((a, b) => a + b.hps, 0);
      return th === 0 ? 0 : (ts / th) * 100 * weight;
    };

    const written = getWeighted(writtenWorks, 0.20);
    const performance = getWeighted(performanceTasks, 0.60);
    const examGrade = exam && exam.hps > 0 ? (exam.score / exam.hps) * 100 * 0.20 : 0;

    return (written + performance + examGrade).toFixed(1);
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>

      {error && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 20px', borderRadius: '8px', zIndex: 2000, fontSize: '14px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#991b1b' }}>✕</button>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <h2 style={{ padding: '0 20px', color: '#4338ca', fontSize: '1.2rem' }}>Class Record</h2>
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ padding: '0 20px', color: '#9ca3af', fontSize: '0.7rem', textTransform: 'uppercase' }}>Sections</h4>
          {sections.length === 0 ? (
            <p style={{ padding: '0 20px', fontSize: '12px', color: '#94a3b8' }}>No sections found.</p>
          ) : (
            sections.map(sec => (
              <div
                key={sec.id}
                onClick={() => { setActiveSectionId(sec.id); setExpandedStudentIds([]); }}
                style={{
                  ...sidebarItemStyle,
                  backgroundColor: activeSectionId === sec.id ? '#eef2ff' : 'transparent',
                  color: activeSectionId === sec.id ? '#4338ca' : '#4b5563',
                  borderRight: activeSectionId === sec.id ? '4px solid #4338ca' : 'none',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{sec.sectionName}</div>
                <div style={{ fontSize: '11px' }}>{sec.gradeLevel}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={topBarStyle}>
          <div>
            <h2 style={{ margin: 0 }}>Section {activeSection?.sectionName || ''}</h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => setViewType('card')} style={{ ...toggleBtnStyle, backgroundColor: viewType === 'card' ? '#4338ca' : '#fff', color: viewType === 'card' ? '#fff' : '#4b5563' }}>🎴 Cards View</button>
              <button onClick={() => setViewType('table')} style={{ ...toggleBtnStyle, backgroundColor: viewType === 'table' ? '#4338ca' : '#fff', color: viewType === 'table' ? '#fff' : '#4b5563' }}>📊 Table View</button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280' }}>SELECT PERIOD</label>
            <select
              value={gradingPeriod}
              onChange={(e) => { setGradingPeriod(e.target.value); setExpandedStudentIds([]); }}
              style={selectStyle}
            >
              {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
        </div>

        {isContentLoading ? (
         <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
        ) : !activeSection || activeSection.students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <p>Walang estudyante sa section na ito.</p>
          </div>
        ) : viewType === 'card' ? (

          // --- MODIFIED CARD VIEW ---
          <div style={cardGridStyle}>
            {activeSection.students.map((student) => {
              const { writtenWorks, performanceTasks, exam } = student.quarterData;
              const finalGrade = calculateFinal(student);
              const isPassed = parseFloat(finalGrade) >= 75;
              const isExpanded = expandedStudentIds.includes(student.id);

              const getWeighted = (list: Activity[], weight: number) => {
                const ts = list.reduce((a, b) => a + b.score, 0);
                const th = list.reduce((a, b) => a + b.hps, 0);
                return th === 0 ? '0.0' : ((ts / th) * 100 * weight).toFixed(1);
              };

              return (
                <div key={student.id} style={gradeCardStyle}>
                  {/* Header: Name and Control Button Only */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem' }}>{student.name}</h3>
                    <button 
                      onClick={() => toggleStudentExpand(student.id)} 
                      style={{ 
                        ...avgBtnStyle, 
                        backgroundColor: isExpanded ? '#64748b' : '#4338ca' 
                      }}
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* Hidden/Collapsible Content */}
                  {isExpanded && (
                    <div style={{ marginTop: '15px' }}>
                      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '12px 0' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>Period:</span>
                        <div style={badgeStyle}>{gradingPeriod}</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                        <div style={summaryBoxStyle}>
                          <label style={labelStyle}>Written (20%)</label>
                          <div style={summaryValueStyle}>{getWeighted(writtenWorks, 0.20)}% <small style={contribLabel}>contrib.</small></div>
                        </div>
                        <div style={summaryBoxStyle}>
                          <label style={labelStyle}>Performance (60%)</label>
                          <div style={summaryValueStyle}>{getWeighted(performanceTasks, 0.60)}% <small style={contribLabel}>contrib.</small></div>
                        </div>
                      </div>

                      <div style={{ ...summaryBoxStyle, backgroundColor: '#f5f7ff', borderColor: '#e0e7ff', marginBottom: '15px' }}>
                        <label style={labelStyle}>Quarterly Exam (20%)</label>
                        {exam ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={summaryValueStyle}>{exam.hps > 0 ? ((exam.score / exam.hps) * 100 * 0.20).toFixed(1) : 0}% <small style={contribLabel}>contrib.</small></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ fontSize: '10px', color: '#6b7280' }}>Score:</span>
                              <input
                                type="number"
                                value={exam.score}
                                onChange={(e) => handleScoreChange(student.id, exam.id, 'exam', 0, e.target.value)}
                                style={{ ...inputStyle, width: '50px', border: '1px solid #4338ca' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Wala pang exam.</p>
                        )}
                      </div>

                      {/* Final Grade Indicator */}
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        backgroundColor: isPassed ? '#d1fae5' : '#fee2e2', 
                        border: `1px solid ${isPassed ? '#10b981' : '#ef4444'}` 
                      }}>
                        <div style={{ fontSize: '10px', color: isPassed ? '#065f46' : '#991b1b', fontWeight: 'bold', letterSpacing: '0.5px' }}>FINAL GRADE</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: isPassed ? '#065f46' : '#991b1b' }}>{finalGrade}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        ) : (

          // --- TABLE VIEW ---
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>STUDENT NAME</th>
                  <th style={thStyle}>
                    WRITTEN (20%)
                    <button onClick={() => handleAddActivity('writtenWorks')} style={plusBtnStyle}>+</button>
                  </th>
                  <th style={thStyle}>
                    PERFORMANCE (60%)
                    <button onClick={() => handleAddActivity('performanceTasks')} style={plusBtnStyle}>+</button>
                  </th>
                  <th style={thStyle}>
                    EXAM (20%)
                    {!activeSection.students[0]?.quarterData.exam && (
                      <button onClick={() => { const h = prompt('HPS ng Exam:', '50'); if (h) handleAddExam(parseInt(h)); }} style={plusBtnStyle}>+</button>
                    )}
                  </th>
                  <th style={thStyle}>FINAL</th>
                </tr>
              </thead>
              <tbody>
                {activeSection.students.map(student => {
                  const { writtenWorks, performanceTasks, exam } = student.quarterData;
                  const grade = calculateFinal(student);
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}><strong>{student.name}</strong></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {writtenWorks.length === 0 ? (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                          ) : writtenWorks.map((ww, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <input type="number" value={ww.score} onChange={(e) => handleScoreChange(student.id, ww.id, 'writtenWorks', i, e.target.value)} style={inputStyle} />
                              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>/{ww.hps}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {performanceTasks.length === 0 ? (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                          ) : performanceTasks.map((pt, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <input type="number" value={pt.score} onChange={(e) => handleScoreChange(student.id, pt.id, 'performanceTasks', i, e.target.value)} style={inputStyle} />
                              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>/{pt.hps}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {exam ? (
                          <>
                            <input type="number" value={exam.score} onChange={(e) => handleScoreChange(student.id, exam.id, 'exam', 0, e.target.value)} style={{ ...inputStyle, border: '1px solid #4338ca' }} />
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>/{exam.hps}</div>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <b style={{ fontSize: '1.1rem', color: parseFloat(grade) >= 75 ? '#059669' : '#dc2626' }}>{grade}</b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- STYLES ---
const sidebarStyle: React.CSSProperties = { width: '240px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '20px 0' };
const sidebarItemStyle: React.CSSProperties = { padding: '15px 20px', cursor: 'pointer', transition: '0.2s', marginBottom: '2px' };
const topBarStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' };
const toggleBtnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' };
const selectStyle: React.CSSProperties = { padding: '10px', borderRadius: '8px', border: '2px solid #4338ca', fontWeight: 'bold', color: '#4338ca', cursor: 'pointer', display: 'block', marginTop: '4px' };
const cardGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' };
const gradeCardStyle: React.CSSProperties = { backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: 'fit-content' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.6rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle: React.CSSProperties = { width: '40px', padding: '6px', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' };
const avgBtnStyle: React.CSSProperties = { padding: '8px 15px', borderRadius: '8px', border: 'none', backgroundColor: '#4338ca', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' };
const tableWrapperStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '15px', padding: '20px', border: '1px solid #e5e7eb', overflowX: 'auto' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '12px', fontSize: '0.7rem', color: '#9ca3af', borderBottom: '2px solid #f3f4f6', fontWeight: 'bold' };
const tdStyle: React.CSSProperties = { padding: '16px 12px', verticalAlign: 'top' };
const badgeStyle: React.CSSProperties = { fontSize: '10px', backgroundColor: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' };
const summaryBoxStyle: React.CSSProperties = { backgroundColor: '#f9fafb', padding: '12px', borderRadius: '12px', border: '1px solid #f3f4f6' };
const summaryValueStyle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: '900', color: '#374151' };
const contribLabel: React.CSSProperties = { fontSize: '9px', color: '#9ca3af', fontWeight: 'normal' };
const plusBtnStyle: React.CSSProperties = { marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#4338ca', color: '#fff', cursor: 'pointer', fontSize: '12px' };

export default Grades;