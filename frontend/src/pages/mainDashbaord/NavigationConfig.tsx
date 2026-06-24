// NavigationConfig.tsx
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Grades from './components/Grades';
import Subjects from './components/Subjects';
import Reports from './components/Reports';
import Settings from './components/Settings';

export type PageId = 'dashboard' | 'students' | 'grades' | 'subjects' | 'reports' | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  title: string;
  component: React.ReactNode;
}

export const NAVIGATION_DATA: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', title: 'Dashboard Overview', component: <Dashboard /> },
  { id: 'students',  label: 'Students', title: 'Student Management', component: <Students /> },
  { id: 'grades',    label: 'Grades / Grading', title: 'Grading System', component: <Grades /> },
  { id: 'subjects',  label: 'Subjects / Classes', title: 'Subjects & Schedules', component: <Subjects /> },
  { id: 'reports',   label: 'Reports', title: 'Academic Reports', component: <Reports /> },
  { id: 'settings',  label: 'Settings', title: 'System Settings', component: <Settings /> },
];