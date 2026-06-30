function ResultsPage({ onNavigate }) {
  return (
    <div className="page-card">
      <h2>Results</h2>
      <p>Your score summary will appear here after completing a quiz.</p>
      <div className="result-box">
        <strong>Score:</strong> 8 / 10
      </div>
      <div className="page-actions">
        <button onClick={() => onNavigate('quiz')}>Try Again</button>
        <button onClick={() => onNavigate('home')}>Go Home</button>
      </div>
    </div>
  );
}

export default ResultsPage;
