"use client";

import { useEffect, useState, useRef } from 'react';
import Pagination from "@/app/components/Pagination";
import { useSession } from 'next-auth/react';

export default function Page() {
    const { data: session, status } = useSession();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState(() => {
        // Restore answers from localStorage
        try {
            return JSON.parse(localStorage.getItem('learn-answers')) || {};
        } catch {
            return {};
        }
    });
    const [submitted, setSubmitted] = useState(() => {
        // Restore submitted from localStorage
        try {
            return JSON.parse(localStorage.getItem('learn-submitted')) || {};
        } catch {
            return {};
        }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [ItemsPerPage] = useState(10);
    const questionRefs = useRef([]);

    useEffect(() => {
        const fetchQuestions = async () => {
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
        };
        fetchQuestions();
    }, [status]);

    // Reorder questions to show answered first, then unanswered (only when submitted changes)
    useEffect(() => {
        if (questions.length > 0 && Object.keys(submitted).length > 0) {
            const answeredQuestions = questions.filter(q => submitted[q.id]);
            const unansweredQuestions = questions.filter(q => !submitted[q.id]);
            const reorderedQuestions = [...answeredQuestions, ...unansweredQuestions];
            setQuestions(reorderedQuestions);
        }
    }, [submitted]);

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
        setSubmitted((prev) => {
            const updated = { ...prev, [questionId]: true };
            // Save to localStorage for guests
            if (status !== 'authenticated') {
                const answeredIds = JSON.parse(localStorage.getItem('learn-answered-ids') || '[]');
                if (!answeredIds.includes(questionId)) {
                    answeredIds.push(questionId);
                    localStorage.setItem('learn-answered-ids', JSON.stringify(answeredIds));
                }
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
                })
                .catch(error => {
                    console.error('Error saving to backend:', error);
                    // Optionally show user an error message
                    alert('Failed to save progress. Please try again.');
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

    const handleResetProgress = () => {
        const confirmed = window.confirm(
            'Are you sure you want to reset your learn progress? This will clear all your answered questions and you will need to start over. This action cannot be undone.'
        );
        
        if (confirmed) {
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
                    // Force a page reload to ensure clean state
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error resetting progress:', error);
                    // Force a page reload even if there's an error
                    window.location.reload();
                });
            } else {
                // For guests, just reload the page to ensure clean state
                window.location.reload();
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-700">Progress</span>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">{totalAnswered} / {totalQuestions} answered</span>
                        {totalAnswered > 0 && (
                            <button
                                onClick={handleResetProgress}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                                title="Reset all progress and start over"
                            >
                                Reset Progress
                            </button>
                        )}
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-300">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>
            {currentQuestions.map((q, index) => {
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
                        className={`bg-white shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-gray-100 transition-shadow hover:shadow-2xl ${
                            hasSubmitted ? 'bg-green-50 border-green-200' : ''
                        }`}
                        tabIndex={0}
                        aria-labelledby={`question-title-${q.id}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 id={`question-title-${q.id}`} className="text-xl font-bold text-gray-900">
                                <span className="text-blue-600 font-extrabold mr-2">{(currentPage - 1) * ItemsPerPage + index + 1}.</span> {q.question_text}
                            </h2>
                            {hasSubmitted && (
                                <div className="flex items-center text-green-600 font-semibold">
                                    <span className="text-2xl mr-2">✓</span>
                                    <span>Completed</span>
                                </div>
                            )}
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
                                        <span className="flex-grow text-base sm:text-lg font-medium">{opt.option_letter}. {opt.option_text}</span>
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
                        <div className="flex items-center mt-6">
                            {!hasSubmitted ? (
                                <button
                                    onClick={() => handleSubmit(q.id, index)}
                                    className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    disabled={!canSubmit}
                                    aria-disabled={!canSubmit}
                                >
                                    Submit
                                </button>
                            ) : (
                                <div className="flex items-center text-green-600 font-semibold">
                                    <span className="text-xl mr-2">✓</span>
                                    <span>Question Completed</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={() => setQuestions(shuffleArray([...questions]))}
                    className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                    Shuffle Questions
                </button>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
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
    );
}