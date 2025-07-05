"use client";

import { useEffect, useState, useRef } from 'react';
import Pagination from "@/app/components/Pagination";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { BookOpen, Target, RotateCcw, Shuffle, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';

export default function Page() {
    const { data: session, status } = useSession();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [ItemsPerPage] = useState(10);
    const [submitting, setSubmitting] = useState({});
    const [shuffling, setShuffling] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const questionRefs = useRef([]);

    // Initialize state from localStorage (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedAnswers = JSON.parse(localStorage.getItem('learn-answers')) || {};
                const savedSubmitted = JSON.parse(localStorage.getItem('learn-submitted')) || {};
                setAnswers(savedAnswers);
                setSubmitted(savedSubmitted);
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
                console.log("API response questions:", data);

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
                
                if (status !== 'authenticated') {
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
                    if (status !== 'authenticated') {
                        localStorage.setItem('learn-question-order', JSON.stringify(orderedQuestions.map(q => q.id)));
                    }
                }

                // Set questions first
                setQuestions(orderedQuestions);

                // Fetch progress from backend if logged in
                if (status === 'authenticated') {
                    console.log('Fetching learn progress from backend...');
                    fetch('/api/learn-progress')
                        .then(res => {
                            console.log('Learn progress API response status:', res.status);
                            if (!res.ok) {
                                throw new Error(`HTTP error! status: ${res.status}`);
                            }
                            return res.json();
                        })
                        .then(data => {
                            console.log('Learn progress data received:', data);
                            if (Array.isArray(data.answeredIds) && data.answeredIds.length > 0) {
                                console.log('Setting submitted state for', data.answeredIds.length, 'answered questions');
                                // Set submitted state for answered questions
                                setSubmitted(prev => {
                                    const updated = { ...prev };
                                    data.answeredIds.forEach(id => { updated[id] = true; });
                                    console.log('Updated submitted state:', updated);
                                    return updated;
                                });
                            } else {
                                console.log('No answered questions found in backend');
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
    }, [submitted, loading, questions]);

    // Persist answers to localStorage whenever they change (only for guests)
    useEffect(() => {
        if (status !== 'authenticated') {
            localStorage.setItem('learn-answers', JSON.stringify(answers));
        }
    }, [answers, status]);

    // Persist submitted to localStorage whenever it changes (only for guests)
    useEffect(() => {
        if (status !== 'authenticated') {
            localStorage.setItem('learn-submitted', JSON.stringify(submitted));
        }
    }, [submitted, status]);

	function shuffleArray(array) {
		return array
			.map(value => ({value, sort: Math.random()}))
			.sort((a, b) => a.sort - b.sort)
			.map(({value}) => value);
	}

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

    const handleSubmit = (questionId, idx) => {
        setSubmitting(prev => ({ ...prev, [questionId]: true }));
        
        setSubmitted((prev) => {
            const updated = { ...prev, [questionId]: true };
            // Save to localStorage for guests
            if (status !== 'authenticated') {
                const answeredIds = JSON.parse(localStorage.getItem('learn-answered-ids') || '[]');
                if (!answeredIds.includes(questionId)) {
                    answeredIds.push(questionId);
                    localStorage.setItem('learn-answered-ids', JSON.stringify(answeredIds));
                }
                setSubmitting(prev => ({ ...prev, [questionId]: false }));
                toast.success('Answer submitted successfully!');
            } else {
                // Save to backend for logged-in users
                const answeredIds = Object.keys(updated); // Use the updated state, not prev
                console.log('Saving to backend:', { questionId, answeredIds });
                fetch('/api/learn-progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answeredIds }),
                })
                .then(res => {
                    console.log('Backend save response status:', res.status);
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('Backend save response:', data);
                    console.log('Progress saved successfully to backend');
                    setSubmitting(prev => ({ ...prev, [questionId]: false }));
                    toast.success('Answer submitted successfully!');
                })
                .catch(error => {
                    console.error('Error saving to backend:', error);
                    toast.error('Failed to save progress. Please try again.');
                    setSubmitting(prev => ({ ...prev, [questionId]: false }));
                });
            }
            // localStorage for submitted is handled by useEffect
            return updated;
        });
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
        // Simple streak calculation - could be enhanced with backend tracking
        return Math.min(totalAnswered, 7); // Mock streak for now
    };
    
    const getAccuracy = () => {
        // Mock accuracy calculation - could be enhanced with backend tracking
        return Math.round(85 + Math.random() * 10); // Mock accuracy between 85-95%
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
        
        // Clear localStorage for both guests and logged-in users
        localStorage.removeItem('learn-answers');
        localStorage.removeItem('learn-submitted');
        localStorage.removeItem('learn-answered-ids');
        
        if (status === 'authenticated') {
            // Clear backend progress for logged-in users
            fetch('/api/learn-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answeredIds: [] }),
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
            <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 animate-pulse">Loading questions...</p>
                        <div className="mt-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={confirmResetProgress}
                title="Reset Progress"
                message="Are you sure you want to reset your learn progress? This will clear all your answered questions and you will need to start over. This action cannot be undone."
                confirmText="Reset Progress"
                cancelText="Cancel"
                type="danger"
                loading={resetLoading}
            />
            <ConfirmDialog
                isOpen={showShuffleConfirm}
                onClose={() => setShowShuffleConfirm(false)}
                onConfirm={confirmShuffleQuestions}
                title="Shuffle Questions"
                message="Are you sure you want to shuffle the questions? This will change the order of all questions on the current page."
                confirmText="Shuffle Questions"
                cancelText="Cancel"
                type="warning"
                loading={shuffling}
            />
            <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Learning Mode</h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Master CEH concepts at your own pace. Answer questions, get instant feedback, and track your progress.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Progress</p>
                            <p className="text-2xl font-bold">{progressPercent}%</p>
                        </div>
                        <Target className="w-8 h-8 text-blue-200" />
                    </div>
                    <div className="mt-2">
                        <div className="w-full bg-blue-400 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Completed</p>
                            <p className="text-2xl font-bold">{totalAnswered}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-200" />
                    </div>
                    <p className="text-green-100 text-sm mt-1">of {totalQuestions} questions</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Streak</p>
                            <p className="text-2xl font-bold">{getStreak()}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-200" />
                    </div>
                    <p className="text-purple-100 text-sm mt-1">days active</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Accuracy</p>
                            <p className="text-2xl font-bold">{getAccuracy()}%</p>
                        </div>
                        <Award className="w-8 h-8 text-orange-200" />
                    </div>
                    <p className="text-orange-100 text-sm mt-1">average score</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                <div className="flex items-center space-x-4">
                    {totalAnswered > 0 && (
                        <button
                            onClick={handleResetProgress}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-lg"
                            title="Reset all progress and start over"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Reset Progress</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowShuffleConfirm(true)}
                        disabled={shuffling}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                            shuffling 
                                ? 'bg-purple-400 text-white cursor-not-allowed' 
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                    >
                        {shuffling ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Shuffling...</span>
                            </>
                        ) : (
                            <>
                                <Shuffle className="w-4 h-4" />
                                <span>Shuffle Questions</span>
                            </>
                        )}
                    </button>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Take your time to learn and understand each concept</span>
                </div>
            </div>
            {questions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">No questions available.</p>
                </div>
            ) : (
                currentQuestions.map((q, index) => {
                const userAnswers = answers[q.id] || [];
                const correctAnswers = q.options
                    .filter(o => o.is_correct)
                    .map(o => o.option_letter);
                console.log("Correct Answers:", correctAnswers);
                const isCorrect = userAnswers.length === correctAnswers.length &&
                    userAnswers.every(ans => correctAnswers.includes(ans));
                const hasSubmitted = submitted[q.id];
                const canSubmit = userAnswers.length > 0 && !hasSubmitted;

                return (
                    <div
                        key={q.id}
                        ref={el => questionRefs.current[index] = el}
                        className={`bg-white shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border transition-all duration-300 hover:shadow-2xl ${
                            hasSubmitted ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'border-gray-100 hover:border-blue-200'
                        }`}
                        tabIndex={0}
                        aria-labelledby={`question-title-${q.id}`}
                    >
                        {hasSubmitted && (
                            <div className="flex items-center justify-end mb-4">
                                <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    <span>Completed</span>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                        Question {(currentPage - 1) * ItemsPerPage + index + 1}
                                    </span>
                                    {!hasSubmitted && (
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            Learning Mode
                                        </span>
                                    )}
                                </div>
                                <h2 id={`question-title-${q.id}`} className="text-lg sm:text-xl font-bold text-gray-900 leading-relaxed">
                                    {q.question_text}
                                </h2>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {q.options && q.options.map((opt) => {
                                const isSelected = userAnswers.includes(opt.option_letter);
                                const isCorrectOption = opt.is_correct;

                                // after submission, for each option:
                                // selected & correct: green bg + checkmark
                                // selected & wrong: red bg + cross
                                // unselected & correct: green border + subtle highlight (to show correct answer)
                                // unselected & wrong: normal

                                const optionClass = hasSubmitted
                                    ? isSelected && isCorrectOption
                                        ? 'border-green-600 bg-green-100 text-green-800 animate-pulse'
                                        : isSelected && !isCorrectOption
                                            ? 'border-red-600 bg-red-100 text-red-800 animate-shake'
                                            : !isSelected && isCorrectOption
                                                ? 'border-green-400 bg-green-50 text-green-700'
                                                : 'border-gray-300 bg-white text-gray-700'
                                    : isSelected
                                        ? 'border-blue-500 bg-blue-100 shadow-md'
                                        : 'border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400';

                                return (
                                    <label
                                        key={opt.id}
                                        className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-blue-400 ${optionClass}`}
                                        tabIndex={0}
                                        aria-checked={isSelected}
                                        aria-label={`Option ${opt.option_letter}: ${opt.option_text}`}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled={hasSubmitted}
                                            name={`question-${q.id}`}
                                            value={opt.option_letter}
                                            checked={isSelected}
                                            onChange={() => handleAnswer(q.id, opt.option_letter)}
                                            className="mr-4 w-5 h-5 accent-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                                            aria-checked={isSelected}
                                            aria-label={`Select option ${opt.option_letter}`}
                                        />
                                        <span className="flex-grow text-xs sm:text-sm md:text-base lg:text-lg font-medium">{opt.option_letter}. {opt.option_text}</span>
                                        {/* Icons for feedback */}
                                        {hasSubmitted && (
                                            isCorrectOption && isSelected ? (
                                                <span className="ml-3 flex items-center justify-center w-7 h-7 rounded-full bg-green-200 text-green-700 text-lg font-bold animate-bounce">✓</span>
                                            ) : !isCorrectOption && isSelected ? (
                                                <span className="ml-3 flex items-center justify-center w-7 h-7 rounded-full bg-red-200 text-red-700 text-lg font-bold animate-bounce">✗</span>
                                            ) : null
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                            {!hasSubmitted ? (
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handleSubmit(q.id, index)}
                                        className={`px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                            canSubmit 
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:scale-105' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        disabled={!canSubmit || submitting[q.id]}
                                        aria-disabled={!canSubmit || submitting[q.id]}
                                    >
                                        {submitting[q.id] ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Submit Answer</span>
                                            </div>
                                        )}
                                    </button>
                                    {!canSubmit && (
                                        <p className="text-sm text-gray-500">Select at least one option to submit</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        <span>Question Completed</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Great job! You&apos;ve learned this concept.</p>
                                </div>
                            )}
                            
                            {hasSubmitted && (
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Scroll down for next question</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })
            )}
            {/* Pagination */}
            <div className="flex justify-center mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* Footer */}
            <div className="text-center py-8 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <BookOpen className="w-5 h-5" />
                    <p className="text-sm">
                        Keep learning and improving your CEH knowledge!
                    </p>
                </div>
            </div>
            <style jsx global>{`
                @keyframes animate-shake {
                    10%, 90% { transform: translateX(-1px); }
                    20%, 80% { transform: translateX(2px); }
                    30%, 50%, 70% { transform: translateX(-4px); }
                    40%, 60% { transform: translateX(4px); }
                }
                .animate-shake { animation: animate-shake 0.5s; }
                @keyframes animate-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: animate-fade-in 0.7s; }
            `}</style>
        </div>
        </>
    );
}