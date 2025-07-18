import React, { useState } from 'react';
import { generateQuiz, submitQuiz } from '../api/api';
import LoadingSpinner from './LoadingSpinner';

const QuizTaker = () => {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // Stores { questionId: selectedOptionIndex }
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  // Quiz generation parameters
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('');

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQuizResult(null); // Clear previous results
    setQuizQuestions([]); // Clear previous questions
    setUserAnswers({}); // Clear previous answers

    try {
      const questions = await generateQuiz(numQuestions, difficulty, category);
      if (questions.length === 0) {
        setError("No questions found matching your criteria. Try different filters or generate/create more questions.");
      } else {
        setQuizQuestions(questions);
        setQuizStarted(true);
      }
    } catch (err) {
      setError(err.message || 'An unknown error occurred while generating the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    setError(null);

    // Prepare answers for submission
    const answersToSubmit = quizQuestions.map(q => ({
      question_id: q._id, // Ensure we send the correct ID
      user_answer_index: userAnswers[q._id] !== undefined ? userAnswers[q._id] : -1, // -1 for unanswered
    }));

    try {
      const result = await submitQuiz(answersToSubmit, 'test_user_123'); // You can replace 'test_user_123' with actual user ID later
      setQuizResult(result);
      setQuizStarted(false); // Quiz finished
    } catch (err) {
      setError(err.message || 'An unknown error occurred while submitting the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizResult(null);
    setLoading(false);
    setError(null);
    setQuizStarted(false);
    setNumQuestions(5);
    setDifficulty('medium');
    setCategory('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative my-8 mx-auto max-w-3xl shadow-md" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline ml-2">{error}</span>
        <button onClick={resetQuiz} className="ml-4 px-3 py-1 bg-dark-card text-text-light rounded-md hover:bg-dark-bg transition">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold text-text-light mb-8 text-center">Take a Quiz</h2>

      {!quizStarted && !quizResult && (
        <form onSubmit={handleGenerateQuiz} className="card-style p-8 rounded-xl shadow-custom-light mb-8">
          <div className="mb-5">
            <label htmlFor="numQuizQuestions" className="block text-text-light text-sm font-semibold mb-2">
              Number of Questions:
            </label>
            <input
              type="number"
              id="numQuizQuestions"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="quizDifficulty" className="block text-text-light text-sm font-semibold mb-2">
              Difficulty:
            </label>
            <select
              id="quizDifficulty"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="quizCategory" className="block text-text-light text-sm font-semibold mb-2">
              Category (Optional):
            </label>
            <input
              type="text"
              id="quizCategory"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Science, History"
            />
          </div>

          <button
            type="submit"
            className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out w-full text-lg"
            disabled={loading}
          >
            Generate Quiz
          </button>
        </form>
      )}

      {quizStarted && quizQuestions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-text-light mb-6 text-center">Your Quiz</h3>
          {quizQuestions.map((q, qIndex) => (
            <div key={q._id} className="card-style p-6 rounded-xl shadow-custom-light mb-4">
              <h4 className="text-xl font-semibold mb-4 text-text-light">
                {qIndex + 1}. {q.question_text}
              </h4>
              <div className="space-y-3">
                {q.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    // Re-typed this className for QuizTaker to remove any hidden characters
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out border border-dark-card ${userAnswers[q._id] === optIndex ? 'bg-accent-green/30 text-text-light font-medium border-accent-green' : 'bg-dark-bg text-text-light hover:bg-dark-card'}`}
                  >
                    <input
                      type="radio"
                      name={`question-${q._id}`}
                      value={optIndex}
                      checked={userAnswers[q._id] === optIndex}
                      onChange={() => handleAnswerChange(q._id, optIndex)}
                      className="mr-3"
                    />
                    <span className="font-medium">{String.fromCharCode(65 + optIndex)})</span> {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={handleSubmitQuiz}
            className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out w-full text-lg"
            disabled={loading}
          >
            Submit Quiz
          </button>
        </div>
      )}

      {quizResult && (
        <div className="mt-8 card-style p-8 rounded-xl shadow-custom-light text-center">
          <h3 className="text-3xl font-bold text-text-light mb-4">Quiz Results</h3>
          <p className="text-xl text-text-light mb-2">Total Questions: <span className="font-semibold">{quizResult.total_questions}</span></p>
          <p className="text-xl text-text-light mb-2">Correct Answers: <span className="font-semibold text-success-green">{quizResult.correct_answers}</span></p>
          <p className="text-4xl font-extrabold mb-6 text-accent-green">Score: {quizResult.score.toFixed(2)}%</p>
          <button
            onClick={resetQuiz}
            className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out text-lg"
          >
            Take Another Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;