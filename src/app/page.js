'use client';

import { useEffect, useState } from 'react';
import Pagination from "@/app/components/Pagination";

export default function QuizPage() {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [ItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchQuestions = async () => {
            const res = await fetch('/api/questions');
            const data = await res.json();
            setQuestions(data);
        };
        fetchQuestions().then(r =>
        console.log("questions:", r));
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

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/*<h1 className="text-3xl font-bold text-center mb-6">CEH Exam</h1>*/}
            {currentQuestions.map((q, index) => (
                <div key={q.id} className="bg-white shadow-lg rounded-xl p-5">
                    <h2 className="text-lg mb-4">
                        {(currentPage - 1) * ItemsPerPage + index + 1}. {q.question_text}
                    </h2>
                    <div className="space-y-2">
                        {q.options && q.options.map((opt) => (
                            <label key={opt.id} className="block">
	                            <input
		                            type="checkbox"
	                                name={`question-${q.id}`}
		                            value={opt.option_letter}
		                            checked={answers[q.id]?.includes(opt.option_letter) || false}
		                            onChange={() => handleAnswer(q.id, opt.option_letter)}
		                            className="mr-2"
	                            />
                                <span>{opt.option_letter}. {opt.option_text}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}
