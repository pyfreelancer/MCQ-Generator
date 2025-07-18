const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'; // Your FastAPI backend URL

/**
 * Generates MCQs from text using the backend API.
 * @param {string} topic - The topic for MCQ generation.
 * @param {string} difficulty - The difficulty level (easy, medium, hard).
 * @param {number} num_questions - Number of questions to generate.
 * @param {string} [category] - Optional category.
 * @returns {Promise<Array>} - A promise that resolves to an array of MCQ objects.
 */
export const generateMCQs = async (topic, difficulty, num_questions, category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcq/generate-from-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, difficulty, num_questions, category }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate MCQs from backend.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating MCQs:', error);
    throw error;
  }
};

/**
 * Fetches all questions from the backend API, with optional filters.
 * @param {object} [filters={}] - Optional filters like difficulty, category, source.
 * @returns {Promise<Array>} - A promise that resolves to an array of question objects.
 */
export const getQuestions = async (filters = {}) => {
  try {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/mcq/questions?${query}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch questions from backend.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

/**
 * Creates a new question manually in the backend.
 * @param {object} questionData - The question object to create.
 * @returns {Promise<object>} - A promise that resolves to the created question object.
 */
export const createQuestion = async (questionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcq/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create question.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

/**
 * Updates an existing question in the backend.
 * @param {string} questionId - The ID of the question to update.
 * @param {object} questionData - The updated question data.
 * @returns {Promise<object>} - A promise that resolves to the updated question object.
 */
export const updateQuestion = async (questionId, questionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcq/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update question.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

/**
 * Deletes a question from the backend.
 * @param {string} questionId - The ID of the question to delete.
 * @returns {Promise<void>} - A promise that resolves if the deletion is successful.
 */
export const deleteQuestion = async (questionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mcq/questions/${questionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete question.');
    }
    // No content expected for 204 No Content
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};


/**
 * Generates a quiz by fetching a set of questions from the backend.
 * @param {number} num_questions - Number of questions for the quiz.
 * @param {string} [difficulty] - Optional difficulty filter.
 * @param {string} [category] - Optional category filter.
 * @returns {Promise<Array>} - A promise that resolves to an array of quiz question objects.
 */
export const generateQuiz = async (num_questions, difficulty, category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ num_questions, difficulty, category }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate quiz.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

/**
 * Submits user answers for a quiz to the backend for scoring.
 * @param {Array<object>} answers - Array of user answers: [{ question_id: string, user_answer_index: number }]
 * @param {string} [userId] - Optional user ID.
 * @returns {Promise<object>} - A promise that resolves to the quiz result object.
 */
export const submitQuiz = async (answers, userId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers, user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit quiz.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

/**
 * Uploads a document to the backend for MCQ generation.
 * @param {File} file - The document file to upload.
 * @param {number} num_questions_per_chunk - Number of questions to generate per chunk.
 * @param {string} difficulty - Difficulty level for generated MCQs.
 * @param {string} [category] - Optional category for generated MCQs.
 * @returns {Promise<object>} - A promise that resolves to the uploaded document's metadata.
 */
export const uploadDocumentAndGenerateMCQs = async (file, num_questions_per_chunk, difficulty, category) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions_per_chunk', num_questions_per_chunk);
    formData.append('difficulty', difficulty);
    if (category) {
      formData.append('category', category);
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      // No 'Content-Type' header needed for FormData; fetch sets it automatically
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload document and generate MCQs.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Fetches a list of all uploaded documents.
 * @returns {Promise<Array>} - A promise that resolves to an an array of document metadata objects.
 */
export const getUploadedDocuments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/uploaded`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch uploaded documents.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching uploaded documents:', error);
    throw error;
  }
};

/**
 * Exports questions as a JSON file from the backend.
 * @param {string[]} [questionIds] - Optional array of question IDs to export.
 * @param {string} [difficulty] - Optional difficulty filter.
 * @param {string} [category] - Optional category filter.
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the JSON data.
 */
export const exportQuestionsJson = async (filters = {}) => {
  try {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/export/json?${query}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to export questions.');
    }

    // Return the response as a Blob, which can then be downloaded
    return response.blob();
  } catch (error) {
    console.error('Error exporting questions:', error);
    throw error;
  }
};