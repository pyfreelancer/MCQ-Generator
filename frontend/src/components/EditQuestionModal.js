import React, { useState, useEffect } from 'react';
import { updateQuestion } from '../api/api';
import LoadingSpinner from './LoadingSpinner';
import { X } from 'lucide-react';

const EditQuestionModal = ({ question, onClose, onUpdateSuccess }) => {
  const [questionText, setQuestionText] = useState(question.question_text);
  const [options, setOptions] = useState(question.options);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(question.correct_answer_index);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [categories, setCategories] = useState(question.categories.join(', '));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Adjust correctAnswerIndex if options array changes such that the current index becomes invalid.
    // This handles cases where options are removed, especially if the previously selected correct answer
    // is now out of bounds.
    if (correctAnswerIndex === null || correctAnswerIndex >= options.length || correctAnswerIndex < 0) {
      setCorrectAnswerIndex(0); // Default to the first option if the current index is invalid
    }
  }, [options, correctAnswerIndex]); // Depend on options and correctAnswerIndex

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOptionField = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOptionField = (indexToRemove) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, index) => index !== indexToRemove);
      setOptions(newOptions);

      // Adjust correct answer index if the removed option was the correct one,
      // or if options shift and the index needs to be decremented.
      if (correctAnswerIndex === indexToRemove) {
        setCorrectAnswerIndex(0); // Reset to first option if the removed one was the correct answer
      } else if (correctAnswerIndex > indexToRemove) {
        setCorrectAnswerIndex(prevIndex => prevIndex - 1); // Decrement if correct answer was after the removed one
      }
      // If correctAnswerIndex is less than indexToRemove, it remains unchanged.
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    const trimmedQuestionText = questionText.trim();
    const trimmedOptions = options.map(opt => opt.trim());
    const validOptions = trimmedOptions.filter(opt => opt !== '');

    if (!trimmedQuestionText || validOptions.length < 2) {
      setError('Please provide a question and at least two non-empty options.');
      setLoading(false);
      return;
    }

    if (correctAnswerIndex === null || correctAnswerIndex < 0 || correctAnswerIndex >= trimmedOptions.length || !trimmedOptions[correctAnswerIndex]) {
      setError('Please select a valid correct answer from the available options.');
      setLoading(false);
      return;
    }

    try {
      const updatedQuestionData = {
        question_text: trimmedQuestionText,
        options: trimmedOptions,
        correct_answer_index: parseInt(correctAnswerIndex),
        explanation: explanation.trim() || null, // Send null if explanation is empty
        difficulty: difficulty,
        categories: categories.split(',').map(cat => cat.trim()).filter(cat => cat !== ''), // Ensure only non-empty categories are sent
      };

      const updated = await updateQuestion(question._id, updatedQuestionData);
      onUpdateSuccess(updated);
      onClose(); // Close modal on successful update
    } catch (err) {
      console.error("Error updating question:", err);
      setError(err.message || 'An unknown error occurred while updating the question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="card-style p-8 rounded-xl shadow-custom-light max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <h2 className="text-2xl font-bold text-text-light text-center mb-6">Edit Question</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-light transition duration-200"
          title="Close"
        >
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="questionText" className="block text-text-light text-sm font-semibold mb-2">
              Question Text:
            </label>
            <textarea
              id="questionText"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows="3"
              required
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-text-light text-sm font-semibold mb-2">
              Options:
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center mb-3">
                <span className="font-bold mr-3 w-6 text-lg text-text-light">{String.fromCharCode(65 + index)})</span>
                <input
                  type="text"
                  id={`option-${index}`}
                  className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg flex-grow focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOptionField(index)}
                    className="ml-3 bg-dark-bg hover:bg-dark-card text-error-red text-xs font-bold py-1.5 px-2.5 rounded-full transition duration-200 transform hover:scale-110 shadow-sm border border-dark-card"
                    title="Remove option"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOptionField}
                className="mt-3 bg-dark-card hover:bg-dark-bg text-text-light text-sm font-bold py-2 px-4 rounded-lg transition duration-200 shadow-sm hover:shadow-md border border-dark-card"
              >
                + Add Option
              </button>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="correctAnswer" className="block text-text-light text-sm font-semibold mb-2">
              Correct Answer:
            </label>
            <select
              id="correctAnswer"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={correctAnswerIndex}
              onChange={(e) => setCorrectAnswerIndex(parseInt(e.target.value))}
              required
            >
              {options.map((option, index) => (
                <option key={index} value={index} disabled={!option.trim()} className="bg-dark-card text-text-light">
                  {String.fromCharCode(65 + index)}) {option.trim() || `(Option ${String.fromCharCode(65 + index)})`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="explanation" className="block text-text-light text-sm font-semibold mb-2">
              Explanation (Optional):
            </label>
            <textarea
              id="explanation"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide an optional explanation for the correct answer."
              rows="2"
            ></textarea>
          </div>

          <div className="mb-4">
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
              placeholder="e.g., Science, History, Biology"
            />
          </div>

          <button
            type="submit"
            className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out w-full text-lg"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Question'}
          </button>
        </form>

        {loading && <LoadingSpinner />}
        {error && (
          <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative mt-4 shadow-md" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditQuestionModal;