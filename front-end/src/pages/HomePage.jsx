function HomePage({ onNavigate }) {
  return (
    <div className="page-card">
      <h2>Welcome to Quizify</h2>
      <p>Start your quiz journey, log in, and view your results in one place.</p>
      <div className="page-actions">
        <button onClick={() => onNavigate('quiz')}>Take Quiz</button>
        <button onClick={() => onNavigate('login')}>Login</button>
      </div>
    </div>
  );
}

export default HomePage;
