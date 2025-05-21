"use client";

import { useEffect, useState } from 'react';
import Pagination from "@/app/components/Pagination";

export default function Page() {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [ItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchQuestions = async () => {
            const res = await fetch('/api/questions');
            const data = await res.json();
            console.log("API response questions:", data);

            // Normalize is_correct to ensure it's boolean
            const normalized = data.map(q => {
                // Extract correct option letters into a Set for fast lookup
                const correctSet = new Set(q.correct_answers.map(ca => ca.correct_option));

                // Mark each option with is_correct based on the correctSet
                const options = (q.options || []).map(opt => ({
                    ...opt,
                    is_correct: correctSet.has(opt.option_letter),
                }));

                return {
                    ...q,
                    options,
                };
            });
            setQuestions(normalized);
        };
        fetchQuestions();
    }, []);

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

    const handleSubmit = (questionId) => {
        setSubmitted((prev) => ({
            ...prev,
            [questionId]: true,
        }));
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {currentQuestions.map((q, index) => {
                const userAnswers = answers[q.id] || [];
                const correctAnswers = q.options
                    .filter(o => o.is_correct)
                    .map(o => o.option_letter);
                console.log("Correct Answers:", correctAnswers);
                const isCorrect = userAnswers.length === correctAnswers.length &&
                    userAnswers.every(ans => correctAnswers.includes(ans));
                const hasSubmitted = submitted[q.id];

                return (
                    <div key={q.id} className="bg-white shadow-lg rounded-xl p-5">
                        <h2 className="text-lg mb-4">
                            {(currentPage - 1) * ItemsPerPage + index + 1}. {q.question_text}
                        </h2>
                        <div className="space-y-2">
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
                                        ? 'border-green-600 bg-green-100 text-green-800'
                                        : isSelected && !isCorrectOption
                                            ? 'border-red-600 bg-red-100 text-red-800'
                                            : !isSelected && isCorrectOption
                                                ? 'border-green-400 bg-green-50 text-green-700'
                                                : 'border-gray-300 bg-white text-gray-700'
                                    : isSelected
                                        ? 'border-blue-500 bg-blue-100'
                                        : 'border-gray-300 bg-white';

                                return (
                                    <label
                                        key={opt.id}
                                        className={`flex items-center p-2 rounded border transition-colors cursor-pointer ${optionClass}`}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled={hasSubmitted}
                                            name={`question-${q.id}`}
                                            value={opt.option_letter}
                                            checked={isSelected}
                                            onChange={() => handleAnswer(q.id, opt.option_letter)}
                                            className="mr-3"
                                        />
                                        <span className="flex-grow">{opt.option_letter}. {opt.option_text}</span>
                                        {/* Icons for feedback */}
                                        {hasSubmitted && (
                                            isCorrectOption && isSelected ? (
                                                <span className="text-green-600 font-bold ml-2">✓</span>
                                            ) : !isCorrectOption && isSelected ? (
                                                <span className="text-red-600 font-bold ml-2">✗</span>
                                            ) : null
                                        )}
                                    </label>
                                );
                            })}
                        </div>
	                    {!hasSubmitted ? (
                            <button
                                onClick={() => handleSubmit(q.id)}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Submit
                            </button>
                        ) : (
                            <div className="mt-4 text-sm font-semibold">
                                {isCorrect ? (
                                    <span className="text-green-600">Correct!</span>
                                ) : (
                                    <span className="text-red-600">Incorrect</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}