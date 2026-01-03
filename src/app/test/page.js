"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const timerRef = useRef(null);
  const { startExam: startExamContext, endExam } = useExam();

  // Move handleExamSubmit above useEffect
  const handleExamSubmit = useCallback(async () => {
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
    if (session) {
      await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score, userId: session.user.id }),
      });
    }
  }, [questions, answers, session, endExam]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      let answeredIds = [];
      try {
        const progressRes = await fetch('/api/learn-progress');
        if (progressRes.ok) {
          const progress = await progressRes.json();
          answeredIds = Array.isArray(progress.answeredIds) ? progress.answeredIds : [];
        }
      } catch (e) {
        // Ignore, fallback to empty
      }
      const excludeParam = answeredIds.length > 0 ? `?excludeIds=${answeredIds.join(',')}` : '';
      const res = await fetch(`/api/questions${excludeParam}`);
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
      setLoadingQuestions(false);
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
  }, [timeLeft, submitted, handleExamSubmit]);

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

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <p className="text-xl font-bold text-slate-900 animate-pulse">Scanning Exam Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            setShowExamIntro(true); // Go back to intro instead of blank message
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

        {showExamIntro && !examStarted && (
          <div className="text-center space-y-12 animate-fade-in">
            <div className="relative inline-block">
              <div className="p-8 bg-white rounded-[3rem] shadow-2xl glass-morphism animate-bounce-slow">
                <AlertTriangle className="w-24 h-24 text-indigo-600 drop-shadow-2xl mx-auto" />
              </div>
              <div className="absolute -top-4 -right-4 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black shadow-xl border-4 border-white tracking-widest">
                FINAL EXAM
              </div>
            </div>

            <div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                Certification <span className="premium-text-gradient">Simulation</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                This environment mirrors the rigor of the actual CEH examination. Please ensure you are in a distraction-free area.
              </p>
            </div>

            <div className="max-w-xl mx-auto grid gap-6">
              {[
                { icon: Clock, label: "Duration", val: "120 Minutes" },
                { icon: Navigation, label: "Questions", val: "120 Multiple Choice" },
                { icon: AlertTriangle, label: "Anti-Leak", val: "Copy Protection Active" }
              ].map((item, i) => (
                <div key={i} className="glass-card flex items-center justify-between !py-4 transition-transform hover:scale-105">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-900">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">{item.val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={startExam}
              className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-2 active:scale-95"
            >
              Initiate Exam Session
            </button>
          </div>
        )}

        {examStarted && !submitted && (
          <div className="space-y-8 animate-fade-in">
            {/* Progress Header */}
            <div className="glass-card !p-6 flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span>Exam Progress</span>
                  <span className="text-indigo-600">{answeredCount} / {questions.length} Answered</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full premium-gradient transition-all duration-500 ease-out"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                <div className="text-right">
                  <div className={`text-2xl font-black ${timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Time Left</div>
                </div>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="space-y-6">
              {currentQuestions.map((q, qIndex) => {
                const globalIndex = indexOfFirstQuestion + qIndex;
                const isFlagged = flaggedQuestions.has(q.id);
                const userAnswers = answers[q.id] || [];

                return (
                  <div key={q.id} className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-slate-200 group-hover:bg-indigo-600 transition-colors" />
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                          {globalIndex + 1}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight italic">
                          {q.question_text}
                        </h3>
                      </div>
                      <button
                        onClick={() => toggleFlag(q.id)}
                        className={`p-3 rounded-xl transition-all ${isFlagged ? 'bg-yellow-400 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                      >
                        <Flag className={`w-5 h-5 ${isFlagged ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {q.options.map((opt) => {
                        const isSelected = userAnswers.includes(opt.option_letter);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleAnswer(q.id, opt.option_letter)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-white/50 bg-white/20 hover:border-indigo-200'
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                              }`}>
                              {opt.option_letter}
                            </div>
                            <span className={`text-sm font-semibold text-left ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                              {opt.option_text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination & Global Actions */}
            <div className="flex flex-col gap-8 pb-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />

              <div className="glass-card flex flex-col sm:flex-row items-center justify-between gap-6 border-indigo-100 !bg-indigo-50/30">
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Status Check</div>
                  <div className="text-xl font-black text-indigo-900">
                    {answeredCount} / {questions.length} Questions Answered
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleExitExam} className="px-6 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors">
                    Exit Exam
                  </button>
                  <button
                    onClick={handleExamSubmit}
                    disabled={!allQuestionsAnswered}
                    className={`px-10 py-4 rounded-xl font-black shadow-xl transition-all ${allQuestionsAnswered
                        ? 'bg-indigo-600 text-white hover:scale-105 hover:shadow-indigo-500/25'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    Finish & Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {submitted && results && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <div className="mb-12 relative inline-block">
              <div className="p-8 bg-white rounded-[3rem] shadow-2xl glass-morphism">
                <Trophy className={`w-32 h-32 drop-shadow-2xl mx-auto ${results.score / results.total >= 0.7 ? 'text-yellow-500' : 'text-slate-300'}`} />
              </div>
              <div className={`absolute -bottom-4 -right-4 px-6 py-3 rounded-2xl font-black shadow-xl border-4 border-white animate-bounce-slow text-white ${results.score / results.total >= 0.7 ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                {results.score / results.total >= 0.7 ? 'PASSED' : 'RETRY'}
              </div>
            </div>

            <h1 className="text-5xl font-black text-slate-900 mb-6">
              {results.score / results.total >= 0.7 ? 'Elite Performance!' : 'Study Session Required'}
            </h1>
            <p className="text-xl text-slate-600 mb-12 font-medium">
              You correctly identified {results.score} out of {results.total} cybersecurity threats in this session.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="glass-card !p-8">
                <div className="text-4xl font-black text-indigo-600 mb-2">{results.score}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Points earned</div>
              </div>
              <div className="glass-card !p-8">
                <div className={`text-4xl font-black mb-2 ${results.score / results.total >= 0.7 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Math.round((results.score / results.total) * 100)}%
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Accuracy</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all"
              >
                Retake Exam
              </button>
              <Link href="/leaderboards" className="flex-1 px-8 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all">
                View Global Ranks
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
}
