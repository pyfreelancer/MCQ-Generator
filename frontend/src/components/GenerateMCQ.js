import React, { useState } from 'react';
import { generateMCQs } from '../api/api';
import QuestionCard from './QuestionCard';
import LoadingSpinner from './LoadingSpinner';
import { Lightbulb, Hash, Sliders, List, HelpCircle, Sparkles } from 'lucide-react'; // Added icons

const GenerateMCQ = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(3);
  const [category, setCategory] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedQuestions([]); // Clear previous results

    try {
      // The generateMCQs function call from your API
      const questions = await generateMCQs(topic, difficulty, numQuestions, category);
      setGeneratedQuestions(questions);
    } catch (err) {
      // Check if the error is the 503 from Gemini API
      if (err.message && err.message.includes("503") && err.message.includes("The model is overloaded")) {
        setError("AI generation failed: The model is overloaded. Please try again later.");
      } else {
        setError(err.message || 'An unknown error occurred during MCQ generation.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-4xl font-extrabold text-center text-text-light mb-10">Generate Multiple Choice Questions</h2>

      <div className="card-style p-8 rounded-xl shadow-custom-medium bg-gradient-to-br from-dark-card to-dark-bg relative overflow-hidden">
        {/* Subtle Background Blurs for visual flair */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-accent-green opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-blue opacity-5 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="mb-5">
            <label htmlFor="topic" className="block text-text-secondary text-sm font-semibold mb-2">
              <Lightbulb size={16} className="inline-block mr-2 text-accent-green" /> Topic:
            </label>
            <input
              type="text"
              id="topic"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Artificial Intelligence, Climate Change"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="difficulty" className="block text-text-secondary text-sm font-semibold mb-2">
              <Sliders size={16} className="inline-block mr-2 text-primary-blue" /> Difficulty:
            </label>
            <select
              id="difficulty"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200 cursor-pointer"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="mb-5">
            <label htmlFor="numQuestions" className="block text-text-secondary text-sm font-semibold mb-2">
              <Hash size={16} className="inline-block mr-2 text-warning-orange" /> Number of Questions:
            </label>
            <input
              type="number"
              id="numQuestions"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              min="1"
              max="50"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="category" className="block text-text-secondary text-sm font-semibold mb-2">
              <List size={16} className="inline-block mr-2 text-error-red" /> Category (Optional):
            </label>
            <input
              type="text"
              id="category"
              className="w-full py-2.5 px-4 bg-dark-bg border border-dark-card rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green transition duration-200"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Science, History"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green transition duration-300 ease-in-out text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-3" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} className="mr-3" /> Generate MCQs
              </>
            )}
          </button>
        </form>

        {/* Info Tip */}
        <div className="mt-8 text-center text-text-secondary text-sm flex items-center justify-center p-4 rounded-md bg-dark-bg/50 border border-dark-card">
          <HelpCircle size={18} className="mr-2 text-primary-blue" />
          <p>
            **Why AI Generation?** Leverage advanced models for quick, diverse, and contextually relevant questions. Perfect for quick drafts and inspiration!
          </p>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && (
        <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative mt-6 shadow-md text-center" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {generatedQuestions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-text-light mb-6 text-center">Generated Questions</h3>
          {generatedQuestions.map((question, index) => (
            // Using index as key is generally okay if items don't reorder or get added/removed in the middle
            // If question has a unique ID, use question._id instead
            <QuestionCard key={question._id || index} question={question} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerateMCQ;