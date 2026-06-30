import { useState } from 'react';
import './App.css';
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
  { id: 'login', label: 'Login' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'questions', label: 'Questions' },
  { id: 'categories', label: 'Categories' },
  { id: 'import-export', label: 'Import/Export' },
  { id: 'manual', label: 'Manual Selection' },
  { id: 'playback', label: 'Playback Grid' },
  { id: 'question-play', label: 'Question Play' },
  { id: 'end', label: 'End' },
  { id: 'users', label: 'Users' }
];

function App() {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />;
      case 'login':
        return <LoginPage />;
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
        return <PlaybackGridPage />;
      case 'question-play':
        return <QuestionPlayPage />;
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
      </nav>

      <main className="app-main">{renderPage()}</main>
    </div>
  );
}

export default App;
