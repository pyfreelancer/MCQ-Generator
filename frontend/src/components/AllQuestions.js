import React, { useEffect, useState } from 'react';
import { getQuestions, deleteQuestion } from '../api/api';
import QuestionCard from './QuestionCard';
import LoadingSpinner from './LoadingSpinner';
import EditQuestionModal from './EditQuestionModal';
import ConfirmationModal from './ConfirmationModal';
import { Edit, Trash2 } from 'lucide-react';

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [questionToDeleteId, setQuestionToDeleteId] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedQuestions = await getQuestions();
      setQuestions(fetchedQuestions);
    } catch (err) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleEditClick = (question) => {
    setQuestionToEdit(question);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setQuestionToEdit(null);
  };

  const handleUpdateSuccess = (updatedQuestion) => {
    setQuestions(questions.map(q =>
      q._id === updatedQuestion._id ? updatedQuestion : q
    ));
  };

  const handleDeleteClick = (questionId) => {
    setQuestionToDeleteId(questionId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    setDeleteSuccess(null);
    setDeleteError(null);
    setLoading(true);
    try {
      await deleteQuestion(questionToDeleteId);
      setQuestions(questions.filter(q => q._id !== questionToDeleteId));
      setDeleteSuccess('Question deleted successfully!');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete question.');
    } finally {
      setLoading(false);
      setQuestionToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setQuestionToDeleteId(null);
  };

  if (loading && !questions.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative my-8 mx-auto max-w-3xl shadow-md" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline ml-2">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold text-text-light mb-8 text-center">All Stored Questions</h2>

      {deleteSuccess && (
        <div className="bg-success-green border border-green-700 text-white px-4 py-3 rounded-lg relative mb-4 shadow-md" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline ml-2">{deleteSuccess}</span>
        </div>
      )}
      {deleteError && (
        <div className="bg-error-red border border-red-700 text-white px-4 py-3 rounded-lg relative mb-4 shadow-md" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{deleteError}</span>
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-center text-text-secondary text-lg py-8">No questions found in the database. Generate or create some first!</p>
      ) : (
        <div className="grid gap-6">
          {questions.map((question) => (
            <div key={question._id} className="relative">
              <QuestionCard question={question} />
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                <button
                  onClick={() => handleEditClick(question)}
                  className="bg-dark-card hover:bg-dark-bg text-accent-green text-sm font-bold py-1.5 px-4 rounded-full shadow-md hover:shadow-lg transition duration-200 transform hover:scale-105 flex items-center border border-dark-bg"
                  title="Edit Question"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(question._id)}
                  className="bg-dark-card hover:bg-dark-bg text-error-red text-sm font-bold py-1.5 px-4 rounded-full shadow-md hover:shadow-lg transition duration-200 transform hover:scale-105 flex items-center border border-dark-bg"
                  title="Delete Question"
                >
                  <Trash2 size={16} className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && questionToEdit && (
        <EditQuestionModal
          question={questionToEdit}
          onClose={handleCloseEditModal}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this question? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default AllQuestions;