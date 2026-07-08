import { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import QuestionsPage from './pages/QuestionsPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ImportExportPage from './pages/ImportExportPage.jsx';
import ManualSelectionPage from './pages/ManualSelectionPage.jsx';
import PlaybackGridPage from './pages/PlaybackGridPage.jsx';
import QuestionPlayPage from './pages/QuestionPlayPage.jsx';
import EndPage from './pages/EndPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

const pageList = [
  { id: 'home', label: 'Home' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'questions', label: 'Questions' },
  { id: 'categories', label: 'Categories' },
  { id: 'import-export', label: 'Import/Export' },
  { id: 'manual', label: 'Manual Selection' },
  { id: 'playback', label: 'Playback Grid' },
  { id: 'end', label: 'End' },
  { id: 'users', label: 'Users' }
];

function AppShell() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // لسه مسجّلش دخول → يشوف صفحة اللوجين بس
  if (!user) {
    return <LoginPage />;
  }

  // بتتنده من PlaybackGridPage لما حد يدوس على سؤال معيّن
  const handlePlayQuestion = (questionId) => {
    setActiveQuestionId(questionId);
    setActivePage('question-play');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'questions':
        return <QuestionsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'import-export':
        return <ImportExportPage />;
      case 'manual':
        return <ManualSelectionPage />;
      case 'playback':
        return <PlaybackGridPage onPlayQuestion={handlePlayQuestion} />;
      case 'question-play':
        return (
          <QuestionPlayPage
            questionId={activeQuestionId}
            onBack={() => setActivePage('playback')}
          />
        );
      case 'end':
        return <EndPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <HomePage onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="App">
      <nav className="app-nav">
        {pageList.map((page) => (
          <button
            key={page.id}
            className={activePage === page.id ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActivePage(page.id)}
          >
            {page.label}
          </button>
        ))}
        <button className="nav-btn" onClick={logout}>
          خروج ({user.username})
        </button>
      </nav>

      <main className="app-main">{renderPage()}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
