import React from 'react';

/**
 * Renders a single MCQ question card.
 * @param {object} props - The component props.
 * @param {object} props.question - The question object.
 * @param {string} props.question.question_text - The question text.
 * @param {string[]} props.question.options - An array of options.
 * @param {number} props.question.correct_answer_index - The index of the correct answer.
 * @param {string} [props.question.explanation] - Optional explanation.
 * @param {string} props.question.difficulty - Difficulty level.
 * @param {string[]} props.question.categories - Array of categories.
 */
const QuestionCard = ({ question }) => {
  return (
    <div className="card-style p-6 rounded-xl shadow-custom-light hover:shadow-custom-medium transition-all duration-300 ease-in-out mb-4">
      <h3 className="text-xl md:text-2xl font-semibold mb-4 text-text-light leading-relaxed">
        <span className="text-accent-green mr-2">Q:</span> {question.question_text}
      </h3>
      <ul className="space-y-3">
        {question.options.map((option, index) => (
          <li
            key={index}
            // Re-typed this className template literal to remove any hidden characters
            className={`p-3 rounded-lg transition-all duration-200 ease-in-out flex items-center
                        ${index === question.correct_answer_index
                          ? 'bg-success-green text-white font-medium border border-green-700'
                          : 'bg-dark-bg text-text-light border border-dark-card'}
                        hover:bg-dark-card`}
          >
            <span className="font-bold mr-3 text-lg">{String.fromCharCode(65 + index)})</span> {option}
          </li>
        ))}
      </ul>
      {question.explanation && (
        <div className="mt-5 p-4 bg-dark-bg rounded-lg text-text-light text-sm border border-dark-card">
          <p className="font-semibold mb-1 text-accent-green">Explanation:</p>
          <p className="text-text-secondary">{question.explanation}</p>
        </div>
      )}
      <div className="mt-5 text-sm text-text-secondary flex justify-between items-center border-t border-dark-card pt-4">
        <span>Difficulty: <span className="font-semibold capitalize text-text-light">{question.difficulty}</span></span>
        <span>Categories: <span className="font-semibold text-text-light">{question.categories.join(', ') || 'N/A'}</span></span>
      </div>
    </div>
  );
};

export default QuestionCard;