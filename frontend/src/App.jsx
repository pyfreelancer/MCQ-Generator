import React, { useState } from 'react';
import GenerateMCQ from './components/GenerateMCQ';
import AllQuestions from './components/AllQuestions';
import CreateQuestion from './components/CreateQuestion';
import QuizTaker from './components/QuizTaker';
import DocumentUpload from './components/DocumentUpload';
import ExportOptions from './components/ExportOptions';
import { Brain, ListTodo, PlusCircle, Award, FileUp, Download, Sparkles, ChevronRight } from 'lucide-react'; // Updated icons for hero section

function App() {
  // State to manage which view is active
  const [currentView, setCurrentView] = useState('home'); // Changed initial view to 'home' for hero section

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center text-text-light">
      {/* Header Section */}
      <header className="w-full bg-dark-bg shadow-md py-4 px-8 flex justify-between items-center z-20">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setCurrentView('home')} // Click logo/title to go home
        >
          <Sparkles size={28} className="text-accent-green" /> {/* Sparkle icon */}
          <span className="text-2xl font-bold text-text-light">MCQ Generator</span>
        </div>
        <nav className="flex items-center space-x-6">
          <button onClick={() => setCurrentView('generate')} className="text-text-light hover:text-accent-green transition-colors duration-200 text-lg font-medium">
            AI Generate
          </button>
          <button onClick={() => setCurrentView('allQuestions')} className="text-text-light hover:text-accent-green transition-colors duration-200 text-lg font-medium">
            Question Sets
          </button>
          <button onClick={() => setCurrentView('createQuestion')} className="text-text-light hover:text-accent-green transition-colors duration-200 text-lg font-medium">
            Create
          </button>
          <button onClick={() => setCurrentView('takeQuiz')} className="text-text-light hover:text-accent-green transition-colors duration-200 text-lg font-medium">
            Take Quiz
          </button>
          <button onClick={() => setCurrentView('uploadDocument')} className="text-text-light hover:text-accent-green transition-colors duration-200 text-lg font-medium">
            Upload Doc
          </button>
        </nav>
      </header>

      {/* Hero Section - Only show on 'home' view */}
      {currentView === 'home' && (
        <section className="w-full py-20 text-center relative overflow-hidden">
          <h1 className="text-6xl md:text-7xl font-extrabold text-text-light tracking-tight leading-tight mb-6">
            MCQ Generator
          </h1>
          <p className="mt-4 text-xl text-text-secondary max-w-3xl mx-auto mb-12">
            Create engaging multiple choice questions with AI-powered generation, manual creation tools, and document upload capabilities. Perfect for educators, trainers, and content creators.
          </p>
          <button
            onClick={() => setCurrentView('createQuestion')}
            className="bg-accent-green hover:bg-emerald-600 text-dark-bg font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out text-xl flex items-center justify-center mx-auto animate-pulse-subtle"
          >
            Start Creating Questions <ChevronRight size={24} className="ml-2" />
          </button>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto px-4">
            <StatCard value="10K+" label="Questions Generated" />
            <StatCard value="50K+" label="Quizzes Created" />
            <StatCard value="95%" label="Accuracy Rate" />
            <StatCard value="24/7" label="Availability" />
          </div>

          {/* Feature Cards Section - Displayed below stats on homepage */}
          <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto px-4">
            <FeatureCard
              viewName="generate"
              currentView={currentView}
              setCurrentView={setCurrentView}
              Icon={Brain}
              title="AI-Powered Generation"
              description="Generate high-quality MCQs using advanced Hugging Face models and LangChain technology."
            />
            <FeatureCard
              viewName="createQuestion"
              currentView={currentView}
              setCurrentView={setCurrentView}
              Icon={PlusCircle}
              title="Manual Creation"
              description="Create custom questions with full control over content, difficulty, and explanations."
            />
            <FeatureCard
              viewName="uploadDocument"
              currentView={currentView}
              setCurrentView={setCurrentView}
              Icon={FileUp}
              title="Document Upload"
              description="Upload PDFs, Word docs, or text files to automatically generate relevant questions."
            />
            <FeatureCard
              viewName="takeQuiz"
              currentView={currentView}
              setCurrentView={setCurrentView}
              Icon={Award}
              title="Quiz Analytics"
              description="Track performance with detailed analytics and progress reporting."
            />
            <FeatureCard
              viewName="exportOptions"
              currentView={currentView}
              setCurrentView={setCurrentView}
              Icon={Download}
              title="Export Options"
              description="Export your question sets as PDF or JSON for easy sharing and integration."
            />
            {/* THIS IS THE SPECIFIC FEATURE CARD THAT WAS CAUSING THE ISSUE */}
            <FeatureCard
              viewName="takeQuiz" /* Changed to 'takeQuiz' as results are shown there */
              currentView={currentView}
              setCurrentView={setCurrentView}
              Icon={Sparkles} // Placeholder icon, find a more suitable one if available
              title="Instant Results"
              description="Get immediate feedback and detailed explanations for all questions."
            />
          </nav>
        </section>
      )}

      {/* Render specific components based on currentView, outside the main feature grid for clarity */}
      {currentView !== 'home' && (
        <main className="w-full max-w-5xl flex-grow p-4 sm:p-6 lg:p-8">
          {currentView === 'generate' && <GenerateMCQ />}
          {currentView === 'allQuestions' && <AllQuestions />}
          {currentView === 'createQuestion' && <CreateQuestion />}
          {currentView === 'takeQuiz' && <QuizTaker />}
          {currentView === 'uploadDocument' && <DocumentUpload />}
          {currentView === 'exportOptions' && <ExportOptions />}
          {/* {currentView === 'quizResults' && <QuizResults />} */}
        </main>
      )}

      <footer className="mt-16 text-text-secondary text-sm text-center w-full max-w-5xl border-t border-dark-card pt-6">
        &copy; {new Date().getFullYear()} MCQ Generator. All rights reserved.
      </footer>
    </div>
  );
}

// Helper component for Feature Cards
const FeatureCard = ({ viewName, currentView, setCurrentView, Icon, title, description }) => {
  return (
    <div
      onClick={() => setCurrentView(viewName)}
      className={`
        card-style p-6 rounded-xl shadow-custom-light cursor-pointer
        flex flex-col items-start text-left
        transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-custom-medium
      `}
    >
      {Icon && <Icon size={36} className="text-accent-green mb-4" />} {/* Icon with accent green color */}
      <h3 className="text-xl font-semibold mb-2 text-text-light">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
};

// Helper component for Stat Cards in Hero Section
const StatCard = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-4xl font-bold text-accent-green mb-2">{value}</span>
      <span className="text-text-secondary text-lg">{label}</span>
    </div>
  );
};

export default App;