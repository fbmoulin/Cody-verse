import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/ui/layouts/AppLayout';
import ModernHomePage from './pages/modern-home';
import ProfilePage from './pages/profile';
import AchievementsPage from './pages/achievements';
import ChallengePage from './pages/challenge';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import CoursesPage from './pages/courses';
import LessonsPage from './pages/lessons';
import SettingsPage from './pages/settings';
// Import other pages as needed

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes inside AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<ModernHomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId/lessons" element={<LessonsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/challenge/:id" element={<ChallengePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;