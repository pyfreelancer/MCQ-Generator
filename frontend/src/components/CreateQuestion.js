import React, { useState } from 'react';
import { createQuestion } from '../api/api';
import LoadingSpinner from './LoadingSpinner';

const CreateQuestion = () => {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']); // 4 options
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [categories, setCategories] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    // Basic validation
    if (!questionText || options.some(opt => !opt) || correctAnswerIndex === '') {
      setError('Please fill in all required fields (Question, all Options, and Correct Answer).');
      setLoading(false);
      return;
    }

    const questionData = {
      question_text: questionText,
      options: options,
      correct_answer_index: parseInt(correctAnswerIndex),
      explanation: explanation || undefined, // Send undefined if empty
      difficulty: difficulty,
      categories: categories.split(',').map(cat => cat.trim()).filter(cat => cat !== '')
    };

    try {
      await createQuestion(questionData);
      setSuccess('Question created successfully!');
      // Clear form
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex('');
      setExplanation('');
      setDifficulty('medium');
      setCategories('');
    } catch (err) {
      setError(err.message || 'An unknown error occurred while creating the question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold text-center text-text-light mb-8">Create a New Question</h2>

      <form onSubmit={handleSubmit} className="card-style p-8 rounded-xl shadow-custom-light mb-8">
        {/* Question Text */}
        <div className="mb-5">
          <label htmlFor="questionText" className="block text-text-light text-sm font-semibold mb-2">
            Question Text:
          </label>
          <textarea
            id="questionText"
            rows="3"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter the question text here..."
            required
          ></textarea>
        </div>

        {/* Options */}
        <div className="mb-5">
          <label className="block text-text-light text-sm font-semibold mb-2">
            Options:
          </label>
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              // Re-typed this line to fix potential hidden character issues
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200 mb-3"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + index)}`}
              required
            />
          ))}
        </div>

        {/* Correct Answer */}
        <div className="mb-5">
          <label htmlFor="correctAnswer" className="block text-text-light text-sm font-semibold mb-2">
            Correct Answer:
          </label>
          <select
            id="correctAnswer"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={correctAnswerIndex}
            onChange={(e) => setCorrectAnswerIndex(e.target.value)}
            required
          >
            <option value="">Select correct option</option>
            {options.map((option, index) => (
              <option key={index} value={index} disabled={!option}>
                {String.fromCharCode(65 + index)}) {option || `Option ${String.fromCharCode(65 + index)} (empty)`}
              </option>
            ))}
          </select>
        </div>

        {/* Explanation */}
        <div className="mb-5">
          <label htmlFor="explanation" className="block text-text-light text-sm font-semibold mb-2">
            Explanation (Optional):
          </label>
          <textarea
            id="explanation"
            rows="2"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Provide an explanation for the correct answer..."
          ></textarea>
        </div>

        {/* Difficulty */}
        <div className="mb-5">
          <label htmlFor="difficulty" className="block text-text-light text-sm font-semibold mb-2">
            Difficulty:
          </label>
          <select
            id="difficulty"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <label htmlFor="categories" className="block text-text-light text-sm font-semibold mb-2">
            Categories (Comma-separated, Optional):
          </label>
          <input
            type="text"
            id="categories"
            className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="e.g., Science, Biology, Fundamentals"
          />
        </div>

        <button
          type="submit"
          className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out w-full text-lg"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Question'}
        </button>
      </form>

      {loading && <LoadingSpinner />}
      {success && (
        <div className="bg-success-green border border-green-700 text-white px-4 py-3 rounded-lg relative mb-4 shadow-md" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline ml-2">{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative mb-4 shadow-md" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
    </div>
  );
};

export default CreateQuestion;