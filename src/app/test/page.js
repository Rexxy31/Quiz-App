"use client";

import { useEffect, useState, useRef } from 'react';
import Pagination from "@/app/components/Pagination";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, Flag, Navigation, X } from 'lucide-react';
import { useExam } from '../contexts/ExamContext';

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default function ExamPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ItemsPerPage] = useState(10);
  const [showTryAgainConfirm, setShowTryAgainConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds
  const [examStarted, setExamStarted] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [showExamIntro, setShowExamIntro] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExitMessage, setShowExitMessage] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const timerRef = useRef(null);
  const { startExam: startExamContext, endExam } = useExam();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await fetch('/api/questions');
      const data = await res.json();

      // Transform the data to work with the new schema
      const normalized = data.map(q => {
        // Extract correct option letters into a Set for fast lookup
        const correctSet = new Set(q.correct_answers.map(ca => ca.correct_option));

        // Transform the JSON options to match the expected format
        const options = (q.options || []).map((opt, index) => ({
          id: `${q.id}-${index}`, // Generate a unique ID
          option_letter: opt.option,
          option_text: opt.text,
          is_correct: correctSet.has(opt.option),
        }));

        return { ...q, options };
      });

      const shuffled = shuffleArray(normalized).slice(0, 120); // Increased to 120 questions
      setQuestions(shuffled);
    };

    if (status === 'authenticated') {
      fetchQuestions();
    }
  }, [status]);

  // Timer effect
  useEffect(() => {
    if (examStarted && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up! Auto-submit the exam
            setShowTimeUpDialog(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [examStarted, submitted, timeLeft]);

  // Handle time up
  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleExamSubmit();
    }
  }, [timeLeft, submitted]);

  // Prevent navigation and copying during exam
  useEffect(() => {
    if (examStarted && !submitted) {
      // Prevent navigation
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
        return 'Are you sure you want to leave? Your exam progress will be lost.';
      };

      // Prevent right-click context menu
      const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
      };

      // Prevent keyboard shortcuts
      const handleKeyDown = (e) => {
        // Prevent Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+Z, F5, Ctrl+R
        if (
          (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'x' || e.key === 'z')) ||
          e.key === 'F5' ||
          (e.ctrlKey && e.key === 'r')
        ) {
          e.preventDefault();
          return false;
        }
        
        // Prevent F12 (developer tools)
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
      };

      // Prevent text selection
      const handleSelectStart = (e) => {
        e.preventDefault();
        return false;
      };

      // Prevent drag and drop
      const handleDragStart = (e) => {
        e.preventDefault();
        return false;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('selectstart', handleSelectStart);
      document.addEventListener('dragstart', handleDragStart);

      // Disable navigation links
      const navLinks = document.querySelectorAll('a[href]');
      navLinks.forEach(link => {
        link.style.pointerEvents = 'none';
        link.style.opacity = '0.5';
      });

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('dragstart', handleDragStart);

        // Re-enable navigation links
        navLinks.forEach(link => {
          link.style.pointerEvents = 'auto';
          link.style.opacity = '1';
        });
      };
    }
  }, [examStarted, submitted]);

  const indexOfLastQuestion = currentPage * ItemsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - ItemsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(questions.length / ItemsPerPage);

  const handleAnswer = (questionId, optionLetter) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];

      if (currentAnswers.includes(optionLetter)) {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((a) => a !== optionLetter),
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentAnswers, optionLetter],
        };
      }
    });
  };

  const handleExamSubmit = async () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    let score = 0;
    const answeredQuestions = questions.map(q => {
      const userAnswers = answers[q.id] || [];
      const correctAnswers = q.options.filter(o => o.is_correct).map(o => o.option_letter);
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every(ans => correctAnswers.includes(ans));
      
      if (isCorrect) {
        score++;
      }
      return { ...q, isCorrect, userAnswers };
    });

    setResults({ score, total: questions.length, answeredQuestions });
    setSubmitted(true);
    endExam();
    
    if(session) {
      await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score, userId: session.user.id }),
      });
    }
  };

  // Check if all questions are answered
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === questions.length;

  // Get question status for navigation
  const getQuestionStatus = (questionIndex) => {
    const question = questions[questionIndex];
    const isAnswered = answers[question.id] && answers[question.id].length > 0;
    const isFlagged = flaggedQuestions.has(question.id);
    const isCurrent = questionIndex >= (currentPage - 1) * ItemsPerPage && questionIndex < currentPage * ItemsPerPage;
    
    if (isCurrent) return 'current';
    if (isFlagged && isAnswered) return 'flagged-answered';
    if (isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const startExam = () => {
    setExamStarted(true);
    setShowExamIntro(false);
    startExamContext();
  };

  const handleExitExam = () => {
    setShowExitConfirm(true);
  };

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeLeft <= 600) return 'text-yellow-600'; // Last 10 minutes
    return 'text-gray-700';
  };
  
  if (status === 'loading') {
    return <div className="text-center mt-20">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    return null; // or a login prompt
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showTryAgainConfirm}
        onClose={() => setShowTryAgainConfirm(false)}
        onConfirm={() => window.location.reload()}
        title="Start New Exam"
        message="Are you sure you want to start a new exam? This will clear your current exam and you'll need to answer all questions again."
        confirmText="Start New Exam"
        cancelText="Cancel"
        type="warning"
      />
      <ConfirmDialog
        isOpen={showTimeUpDialog}
        onClose={() => setShowTimeUpDialog(false)}
        onConfirm={() => setShowTimeUpDialog(false)}
        title="Time's Up!"
        message="Your exam time has expired. Your answers have been automatically submitted."
        confirmText="View Results"
        cancelText="Close"
        type="info"
      />
      <ConfirmDialog
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          setExamStarted(false);
          setShowExamIntro(false);
          setShowExitMessage(true);
          setTimeLeft(120 * 60);
          setAnswers({});
          setCurrentPage(1);
          setSubmitted(false);
          setResults(null);
          setFlaggedQuestions(new Set());
          setShowQuestionNav(false);
          endExam();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }}
        title="Exit Exam"
        message="Are you sure you want to exit the exam? All your progress will be lost and no results will be saved."
        confirmText="Exit Exam"
        cancelText="Continue Exam"
        type="warning"
      />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">CEH Practice Exam</h1>
      
      {/* Exit Message */}
      {showExitMessage && (
        <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-red-500">
          <h2 className="text-2xl font-bold mb-4 text-center text-red-600">Exam Exited</h2>
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              You have exited the exam. All progress has been lost and no results were saved.
            </p>
            <p className="text-gray-700 font-semibold">
              You will need to retake the exam to get your results.
            </p>
            <button
              onClick={() => {
                setShowExitMessage(false);
                setShowExamIntro(true);
              }}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg"
            >
              Start New Exam
            </button>
          </div>
        </div>
      )}
      
      {/* Exam Introduction */}
      {showExamIntro && questions.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold mb-4 text-center">Exam Instructions</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-0.5">1</div>
              <div>
                <p className="font-semibold">Exam Duration: 120 minutes</p>
                <p className="text-sm text-gray-600">You will have exactly 2 hours to complete all 120 questions.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-0.5">2</div>
              <div>
                <p className="font-semibold">Question Format: Multiple Choice</p>
                <p className="text-sm text-gray-600">Some questions may have multiple correct answers. Select all that apply.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-0.5">3</div>
              <div>
                <p className="font-semibold">Auto-Submission</p>
                <p className="text-sm text-gray-600">The exam will automatically submit when time expires.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-0.5">4</div>
              <div>
                <p className="font-semibold">Navigation</p>
                <p className="text-sm text-gray-600">Use the pagination to navigate between questions. You can review and change answers.</p>
              </div>
            </div>

          </div>
          <div className="mt-6 text-center">
            <button
              onClick={startExam}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg"
            >
              Take Exam
            </button>
          </div>
        </div>
      )}

      {/* Timer Display */}
      {!submitted && examStarted && (
        <div className="bg-white shadow-lg rounded-xl p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Time Remaining:</span>
            </div>
            <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress: {answeredCount} / {questions.length} questions</span>
              <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {timeLeft <= 300 && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Less than 5 minutes remaining!</span>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handleExitExam}
              className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
            >
              Exit Exam
            </button>
            <button
              onClick={() => setShowQuestionNav(!showQuestionNav)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
            >
              <Navigation className="w-4 h-4" />
              <span>{showQuestionNav ? 'Hide' : 'Show'} Navigation</span>
            </button>
          </div>
        </div>
      )}

      {/* Question Navigation Bar */}
      {!submitted && examStarted && showQuestionNav && (
        <div className="bg-white shadow-lg rounded-xl p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Question Navigation</h3>
            <button
              onClick={() => setShowQuestionNav(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-10 gap-1 mb-3">
            {questions.map((question, index) => {
              const status = getQuestionStatus(index);
              const statusClasses = {
                'current': 'bg-blue-500 text-white border-blue-500',
                'answered': 'bg-green-100 text-green-700 border-green-300',
                'flagged': 'bg-yellow-100 text-yellow-700 border-yellow-300',
                'flagged-answered': 'bg-orange-100 text-orange-700 border-orange-300',
                'unanswered': 'bg-gray-100 text-gray-600 border-gray-300'
              };
              
              return (
                <button
                  key={question.id}
                  onClick={() => {
                    const targetPage = Math.floor(index / ItemsPerPage) + 1;
                    setCurrentPage(targetPage);
                  }}
                  className={`w-8 h-8 text-xs font-medium rounded border transition-all duration-200 hover:scale-110 ${statusClasses[status]}`}
                  title={`Question ${index + 1} - ${status.replace('-', ' ')}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Flagged</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      )}

      {submitted && results && (
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Exam Complete!</h2>
          {showTimeUpDialog && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 font-medium">⏰ Exam automatically submitted due to time expiration</p>
            </div>
          )}
          <p className="text-4xl font-extrabold text-blue-600">
            {results.score} / {results.total}
          </p>
          <p className="text-lg mt-2">
            You scored {Math.round((results.score / results.total) * 100)}%.
          </p>
          <div className="mt-4 text-sm text-gray-600">
            <p>Questions answered: {answeredCount} / {results.total}</p>
            <p>Time taken: {formatTime(120 * 60 - timeLeft)}</p>
          </div>
          <button
            onClick={() => setShowTryAgainConfirm(true)}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {!submitted && questions.length > 0 && examStarted && (
        <div className="space-y-4 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
          {currentQuestions.map((q, index) => {
            const userAnswers = answers[q.id] || [];
            const questionNumber = (currentPage - 1) * ItemsPerPage + index + 1;
            const isFlagged = flaggedQuestions.has(q.id);
            
            return (
              <div key={q.id} className="bg-white shadow-lg rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg flex-1">
                    Question {questionNumber} of {questions.length}
                  </h2>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={`ml-3 p-2 rounded-full transition-colors duration-200 ${
                      isFlagged 
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                    }`}
                    title={isFlagged ? 'Remove flag' : 'Flag for review'}
                  >
                    <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-gray-700 mb-4">{q.question_text}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = userAnswers.includes(opt.option_letter);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center p-2 rounded border transition-colors cursor-pointer ${
                          isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`question-${q.id}`}
                          value={opt.option_letter}
                          checked={isSelected}
                          onChange={() => handleAnswer(q.id, opt.option_letter)}
                          className="mr-3"
                        />
                        <span className="flex-grow">{opt.option_letter}. {opt.option_text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!submitted && examStarted && (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />

          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p>Questions answered: {answeredCount} / {questions.length}</p>
              <p>Progress: {Math.round((answeredCount / questions.length) * 100)}%</p>
            </div>
            <button
              onClick={handleExamSubmit}
              disabled={!allQuestionsAnswered}
              className={`px-6 py-3 font-semibold rounded transition-colors duration-200 ${
                allQuestionsAnswered 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              {allQuestionsAnswered ? 'Submit Exam' : 'Complete All Questions to Submit'}
            </button>
            {!allQuestionsAnswered && (
              <p className="text-xs text-gray-500">
                You must answer all {questions.length} questions before submitting
              </p>
            )}
          </div>
        </>
      )}
      </div>
    </>
  );
}
