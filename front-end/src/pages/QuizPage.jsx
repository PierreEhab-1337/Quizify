function QuizPage({ onNavigate }) {
  return (
    <div className="page-card">
      <h2>Quiz Page</h2>
      <p>Here you can display questions, answer options, and quiz progress.</p>
      <div className="page-actions">
        <button onClick={() => onNavigate('results')}>Submit Quiz</button>
        <button onClick={() => onNavigate('home')}>Back Home</button>
      </div>
    </div>
  );
}

export default QuizPage;
