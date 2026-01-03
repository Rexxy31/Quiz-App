"use client";

import { useEffect, useState, useRef } from 'react';
import Pagination from "@/app/components/Pagination";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { BookOpen, Target, RotateCcw, Shuffle, CheckCircle, Clock, TrendingUp, Award, X } from 'lucide-react';

export default function Page() {
    const { data: session, status } = useSession();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState({});
    const [correctAnswers, setCorrectAnswers] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [ItemsPerPage] = useState(10);
    const [submitting, setSubmitting] = useState({});
    const [shuffling, setShuffling] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const questionRefs = useRef([]);

    // Initialize state from localStorage (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedAnswers = JSON.parse(localStorage.getItem('learn-answers')) || {};
                const savedSubmitted = JSON.parse(localStorage.getItem('learn-submitted')) || {};
                const savedCorrectAnswers = JSON.parse(localStorage.getItem('learn-correct-answers')) || {};
                setAnswers(savedAnswers);
                setSubmitted(savedSubmitted);
                if (Array.isArray(savedCorrectAnswers)) {
                    // Defensive: check if array contains only single letters (option letters)
                    if (savedCorrectAnswers.every(x => typeof x === 'string' && x.length === 1 && /^[A-Z]$/i.test(x))) {
                        // Ignore legacy/invalid array of option letters
                        setCorrectAnswers({});
                    } else {
                        // Convert legacy array of IDs to object
                        const obj = {};
                        savedCorrectAnswers.forEach(id => { obj[id] = true; });
                        setCorrectAnswers(obj);
                    }
                } else {
                    setCorrectAnswers(savedCorrectAnswers);
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);

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

                    return {
                        ...q,
                        options,
                    };
                });

                // --- Persistence logic start ---
                // Only use localStorage for guests (not logged in)
                let answeredIds = [];
                let order = null;

                if (status !== 'authenticated' && typeof window !== 'undefined') {
                    // For guests, use localStorage
                    answeredIds = JSON.parse(localStorage.getItem('learn-answered-ids') || '[]');
                    order = JSON.parse(localStorage.getItem('learn-question-order') || 'null');
                }

                let orderedQuestions;
                if (order && Array.isArray(order) && order.length === normalized.length) {
                    // Use saved order
                    orderedQuestions = order.map(id => normalized.find(q => q.id === id)).filter(Boolean);
                } else {
                    // Shuffle and save order
                    orderedQuestions = shuffleArray(normalized);
                    if (status !== 'authenticated' && typeof window !== 'undefined') {
                        localStorage.setItem('learn-question-order', JSON.stringify(orderedQuestions.map(q => q.id)));
                    }
                }

                // Set questions first
                setQuestions(orderedQuestions);

                // Fetch progress from backend if logged in
                if (status === 'authenticated') {
                    fetch('/api/learn-progress')
                        .then(res => {
                            if (!res.ok) {
                                throw new Error(`HTTP error! status: ${res.status}`);
                            }
                            return res.json();
                        })
                        .then(data => {
                            if (Array.isArray(data.answeredIds) && data.answeredIds.length > 0) {
                                // Set submitted state for answered questions
                                setSubmitted(prev => {
                                    const updated = { ...prev };
                                    data.answeredIds.forEach(id => { updated[id] = true; });
                                    return updated;
                                });
                            }
                            if (Array.isArray(data.correctIds)) {
                                console.log('correctIds from backend', data.correctIds); // Debug log
                                setCorrectAnswers(prev => {
                                    const updated = { ...prev };
                                    data.correctIds.forEach(id => { updated[String(id)] = true; });
                                    // Mark all other submitted as false if not in correctIds
                                    if (Array.isArray(data.answeredIds)) {
                                        data.answeredIds.forEach(id => {
                                            if (!data.correctIds.includes(id)) {
                                                updated[String(id)] = false;
                                            }
                                        });
                                    }
                                    return updated;
                                });
                            }
                            // Set streak data
                            if (data.currentStreak !== undefined) {
                                setCurrentStreak(data.currentStreak);
                            }
                            if (data.longestStreak !== undefined) {
                                setLongestStreak(data.longestStreak);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching learn progress:', error);
                        });
                }
            } catch (error) {
                console.error('Error fetching questions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (status !== 'loading') {
            fetchQuestions();
        }
    }, [status]);

    // Reorder questions to show answered first, then unanswered (only when submitted changes)
    useEffect(() => {
        if (questions.length > 0 && Object.keys(submitted).length > 0 && !loading) {
            const answeredQuestions = questions.filter(q => submitted[q.id]);
            const unansweredQuestions = questions.filter(q => !submitted[q.id]);
            const reorderedQuestions = [...answeredQuestions, ...unansweredQuestions];
            setQuestions(reorderedQuestions);
        }
    }, [submitted, loading]);

    // Calculate accuracy for existing answered questions on page load
    useEffect(() => {
        if (questions.length > 0 && Object.keys(submitted).length > 0 && Object.keys(answers).length > 0 && !loading) {
            const existingCorrectAnswers = { ...correctAnswers };
            let hasChanges = false;

            Object.keys(submitted).forEach(questionId => {
                if (!(questionId in existingCorrectAnswers)) {
                    const question = questions.find(q => q.id === questionId);
                    if (question) {
                        const userAnswers = answers[questionId] || [];
                        const correctAnswersForQuestion = question.options
                            .filter(o => o.is_correct)
                            .map(o => o.option_letter);

                        const isCorrect = userAnswers.length === correctAnswersForQuestion.length &&
                            userAnswers.every(ans => correctAnswersForQuestion.includes(ans));

                        existingCorrectAnswers[questionId] = isCorrect;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                setCorrectAnswers(existingCorrectAnswers);
            }
        }
    }, [questions, submitted, answers, loading]);

    // Persist answers to localStorage whenever they change (for both guests and logged-in users)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('learn-answers', JSON.stringify(answers));
        }
    }, [answers]);

    // Persist submitted to localStorage whenever it changes (only for guests)
    useEffect(() => {
        if (typeof window !== 'undefined' && status !== 'authenticated') {
            localStorage.setItem('learn-submitted', JSON.stringify(submitted));
        }
    }, [submitted, status]);

    // Persist correct answers to localStorage whenever they change (for both guests and logged-in users)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (typeof correctAnswers === 'object' && !Array.isArray(correctAnswers)) {
                localStorage.setItem('learn-correct-answers', JSON.stringify(correctAnswers));
            } else {
                localStorage.setItem('learn-correct-answers', JSON.stringify({}));
            }
        }
    }, [correctAnswers]);

    function shuffleArray(array) {
        return array
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    const indexOfLastQuestion = currentPage * ItemsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - ItemsPerPage;
    const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

    const totalPages = Math.ceil(questions.length / ItemsPerPage);

    const handleAnswer = (questionId, optionLetter) => {
        setAnswers((prev) => {
            // For radio buttons, replace the current selection
            return {
                ...prev,
                [questionId]: [optionLetter],
            };
        });
    };

    const handleSubmit = (questionId, idx) => {
        // Prevent multiple submissions
        if (submitting[questionId]) return;

        setSubmitting(prev => ({ ...prev, [questionId]: true }));

        // Calculate if the answer is correct
        const userAnswers = answers[questionId] || [];
        const question = questions.find(q => q.id === questionId);
        const correctAnswersForQuestion = question.options
            .filter(o => o.is_correct)
            .map(o => o.option_letter);
        console.log('userAnswers:', userAnswers, 'correctAnswersForQuestion:', correctAnswersForQuestion); // Debug log
        // Robust check: both arrays must have the same length and contain the same elements
        const isCorrect =
            userAnswers.length === correctAnswersForQuestion.length &&
            userAnswers.every(ans => correctAnswersForQuestion.includes(ans)) &&
            correctAnswersForQuestion.every(ans => userAnswers.includes(ans));

        // Update both states at once to prevent multiple re-renders
        setSubmitted(prev => ({ ...prev, [questionId]: true }));
        setCorrectAnswers(prev => ({ ...prev, [questionId]: isCorrect }));

        // Handle saving based on authentication status
        if (status !== 'authenticated' && typeof window !== 'undefined') {
            // For guests, save to localStorage
            const answeredIds = JSON.parse(localStorage.getItem('learn-answered-ids') || '[]');
            if (!answeredIds.includes(questionId)) {
                answeredIds.push(questionId);
                localStorage.setItem('learn-answered-ids', JSON.stringify(answeredIds));
            }
            setSubmitting(prev => ({ ...prev, [questionId]: false }));
            toast.success('Answer submitted successfully!');
        } else {
            // For logged-in users, save to backend
            const currentSubmitted = { ...submitted, [questionId]: true };
            const answeredIds = Object.keys(currentSubmitted);
            const currentCorrectAnswers = { ...correctAnswers, [questionId]: isCorrect };
            const correctIds = Object.keys(currentCorrectAnswers).filter(id => currentCorrectAnswers[id]);
            console.log('correctIds sent to backend', correctIds); // Debug log
            setCorrectAnswers(currentCorrectAnswers); // Update immediately for UI
            fetch('/api/learn-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answeredIds, correctIds }),
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('Learn-progress response:', data); // Debug log
                    setSubmitting(prev => ({ ...prev, [questionId]: false }));
                    toast.success('Answer submitted successfully!');

                    // Update streak data from response
                    if (data.currentStreak !== undefined) {
                        setCurrentStreak(data.currentStreak);
                    }
                    if (data.longestStreak !== undefined) {
                        setLongestStreak(data.longestStreak);
                    }

                    // Refetch progress to ensure state is in sync
                    fetch('/api/learn-progress')
                        .then(res => res.json())
                        .then(data => {
                            if (Array.isArray(data.answeredIds)) {
                                setSubmitted(prev => {
                                    const updated = { ...prev };
                                    data.answeredIds.forEach(id => { updated[id] = true; });
                                    return updated;
                                });
                            }
                            if (Array.isArray(data.correctIds)) {
                                setCorrectAnswers(prev => {
                                    const updated = { ...prev };
                                    data.correctIds.forEach(id => { updated[String(id)] = true; });
                                    if (Array.isArray(data.answeredIds)) {
                                        data.answeredIds.forEach(id => {
                                            if (!data.correctIds.includes(id)) {
                                                updated[String(id)] = false;
                                            }
                                        });
                                    }
                                    return updated;
                                });
                            }
                            // Update streak data from refetch
                            if (data.currentStreak !== undefined) {
                                setCurrentStreak(data.currentStreak);
                            }
                            if (data.longestStreak !== undefined) {
                                setLongestStreak(data.longestStreak);
                            }
                        });
                })
                .catch(error => {
                    console.error('Error saving to backend:', error);
                    toast.error('Failed to save progress. Please try again.');
                    setSubmitting(prev => ({ ...prev, [questionId]: false }));
                });
        }

        // Scroll to next unanswered question
        setTimeout(() => {
            if (questionRefs.current[idx + 1]) {
                questionRefs.current[idx + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    };

    // Progress calculation
    const totalAnswered = Object.keys(submitted).length;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

    // Calculate streak and stats
    const getStreak = () => {
        // Use real streak data from backend for authenticated users
        if (status === 'authenticated') {
            return currentStreak;
        }
        // For guests, use a simple calculation based on answered questions
        return Math.min(totalAnswered, 7);
    };

    const getAccuracy = () => {
        // Real accuracy calculation based on correctly answered questions
        const totalAnswered = Object.keys(submitted).length;
        if (totalAnswered === 0) return 0;

        const totalCorrect = Object.values(correctAnswers).filter(isCorrect => isCorrect).length;

        return Math.round((totalCorrect / totalAnswered) * 100);
    };

    const handleResetProgress = () => {
        setShowResetConfirm(true);
    };

    const confirmResetProgress = () => {
        setResetLoading(true);
        setShowResetConfirm(false);

        // Show loading toast
        const loadingToast = toast.loading('Resetting progress...');

        // Clear submitted state
        setSubmitted({});

        // Clear answers state
        setAnswers({});

        // Clear correct answers state
        setCorrectAnswers({});

        // Clear localStorage for both guests and logged-in users
        if (typeof window !== 'undefined') {
            localStorage.removeItem('learn-answers');
            localStorage.removeItem('learn-submitted');
            localStorage.removeItem('learn-answered-ids');
            localStorage.removeItem('learn-correct-answers');
        }

        if (status === 'authenticated') {
            // Clear backend progress for logged-in users
            fetch('/api/learn-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answeredIds: [], correctIds: [] }),
            })
                .then(res => {
                    console.log('Progress reset response status:', res.status);
                    return res.json();
                })
                .then(data => {
                    console.log('Progress reset response:', data);
                    toast.success('Progress reset successfully!', { id: loadingToast });
                    setResetLoading(false);
                    // Force a page reload to ensure clean state
                    setTimeout(() => window.location.reload(), 1500);
                })
                .catch(error => {
                    console.error('Error resetting progress:', error);
                    toast.error('Failed to reset progress. Please try again.', { id: loadingToast });
                    setResetLoading(false);
                    // Force a page reload even if there's an error
                    setTimeout(() => window.location.reload(), 2000);
                });
        } else {
            // For guests, just reload the page to ensure clean state
            toast.success('Progress reset successfully!', { id: loadingToast });
            setResetLoading(false);
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    const confirmShuffleQuestions = () => {
        setShowShuffleConfirm(false);
        setShuffling(true);
        const loadingToast = toast.loading('Shuffling questions...');
        setTimeout(() => {
            setQuestions(shuffleArray([...questions]));
            setShuffling(false);
            toast.success('Questions shuffled successfully!', { id: loadingToast });
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-6"></div>
                    <p className="text-xl font-bold text-slate-900 animate-pulse">Initializing Practice Environment...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 pt-24 pb-20 text-center">
                <div className="max-w-2xl mx-auto glass-card">
                    <h1 className="text-3xl font-black text-slate-900 mb-4">No Questions Found</h1>
                    <p className="text-slate-600 mb-8">It looks like the question bank is empty. Please check your database connection or seed the database.</p>
                    <Link href="/" className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold inline-block">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50 pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {!isComplete ? (
                    <div className="space-y-8 animate-fade-in">
                        {/* Progress Header */}
                        <div className="glass-card !p-6 flex items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Progress</span>
                                    <span className="text-indigo-600">{currentQuestionIndex + 1} / {questions.length}</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full premium-gradient transition-all duration-500 ease-out"
                                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900">{score}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Points</div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="glass-card relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                            <div className="mb-8">
                                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black tracking-widest uppercase mb-4">
                                    Domain {questions[currentQuestionIndex].domainId || 'Core'}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                                    {questions[currentQuestionIndex].question_text || questions[currentQuestionIndex].question}
                                </h2>
                            </div>

                            <div className="grid gap-4">
                                {(questions[currentQuestionIndex].options || []).map((option, index) => {
                                    const optionText = typeof option === 'string' ? option : option.option_text;
                                    const optionLetter = typeof option === 'string' ? option : option.option_letter;
                                    const isSelected = selectedAnswer === optionLetter || selectedAnswer === optionText;

                                    // Handle correct answer logic based on data structure
                                    const isCorrectAnswer = (opt) => {
                                        if (typeof opt === 'string') return opt === questions[currentQuestionIndex].correctAnswer;
                                        return opt.is_correct;
                                    };

                                    const isCorrect = showFeedback && isCorrectAnswer(option);
                                    const isWrong = showFeedback && isSelected && !isCorrectAnswer(option);

                                    return (
                                        <button
                                            key={index}
                                            disabled={showFeedback}
                                            onClick={() => handleAnswerSelect(optionLetter)}
                                            className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${isSelected && !showFeedback ? 'border-indigo-600 bg-indigo-50/50 shadow-lg' :
                                                    isCorrect ? 'border-emerald-500 bg-emerald-50 shadow-lg' :
                                                        isWrong ? 'border-rose-500 bg-rose-50 shadow-lg' :
                                                            'border-white/50 bg-white/30 hover:border-indigo-200 hover:bg-white hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${isSelected || isCorrect || isWrong ? 'bg-white shadow-sm' : 'bg-slate-100'
                                                    } ${isCorrect ? 'text-emerald-600' :
                                                        isWrong ? 'text-rose-600' :
                                                            isSelected ? 'text-indigo-600' : 'text-slate-400'
                                                    }`}>
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span className={`text-lg font-semibold ${isSelected || isCorrect || isWrong ? 'text-slate-900' : 'text-slate-600'
                                                    }`}>
                                                    {optionText}
                                                </span>
                                                {(isCorrect || isWrong) && (
                                                    <div className="ml-auto">
                                                        {isCorrect ? (
                                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                                        ) : (
                                                            <X className="w-6 h-6 text-rose-600" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {showFeedback && (
                                <div className="mt-10 pt-10 border-t border-slate-100 animate-fade-in-up">
                                    <div className={`p-6 rounded-2xl ${selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                                        }`}>
                                        <h4 className="font-black text-sm uppercase tracking-widest mb-3">
                                            {selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 'Excellent Work!' : 'Not quite right'}
                                        </h4>
                                        <p className="text-lg leading-relaxed mb-6">
                                            {questions[currentQuestionIndex].explanation}
                                        </p>
                                        <button
                                            onClick={handleNextQuestion}
                                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                                        >
                                            {currentQuestionIndex === questions.length - 1 ? 'Finish Study' : 'Next Question'}
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto text-center animate-fade-in">
                        <div className="mb-12 relative inline-block">
                            <div className="p-8 bg-white rounded-[3rem] shadow-2xl glass-morphism">
                                <Trophy className="w-32 h-32 text-yellow-500 drop-shadow-2xl mx-auto" />
                            </div>
                            <div className="absolute -bottom-4 -right-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl border-4 border-white animate-bounce-slow">
                                COMPLETE
                            </div>
                        </div>

                        <h1 className="text-5xl font-black text-slate-900 mb-6">Great Progress!</h1>
                        <p className="text-xl text-slate-600 mb-12 font-medium">
                            You've completed the study module. Here's a summary of your performance.
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="glass-card !p-8">
                                <div className="text-4xl font-black text-indigo-600 mb-2">{score}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total score</div>
                            </div>
                            <div className="glass-card !p-8">
                                <div className="text-4xl font-black text-emerald-600 mb-2">
                                    {Math.round((score / (questions.length * 10)) * 100)}%
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accuracy</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all"
                            >
                                Study Again
                            </button>
                            <Link href="/" className="flex-1 px-8 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}