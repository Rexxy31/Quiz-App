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

			const normalized = data.map(q => {
				const correctSet = new Set(q.correct_answers.map(ca => ca.correct_option));
				const options = (q.options || []).map(opt => ({
					...opt,
					is_correct: correctSet.has(opt.option_letter),
				}));
				return { ...q, options };
			});
			setQuestions(shuffleArray(normalized));
		};
		fetchQuestions();
	}, []);

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
		<div className="max-w-6xl mx-auto p-6 space-y-6 bg-indigo-50 dark:bg-gray-900 text-black dark:text-white min-h-screen">
			{currentQuestions.map((q, index) => {
				const userAnswers = answers[q.id] || [];
				const correctAnswers = q.options
					.filter(o => o.is_correct)
					.map(o => o.option_letter);

				const isCorrect =
					userAnswers.length === correctAnswers.length &&
					userAnswers.every(ans => correctAnswers.includes(ans));
				const hasSubmitted = submitted[q.id];

				return (
					<div key={q.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5">
						<h2 className="text-lg mb-4">
							{(currentPage - 1) * ItemsPerPage + index + 1}. {q.question_text}
						</h2>
						<div className="space-y-2">
							{q.options && q.options.map((opt) => {
								const isSelected = userAnswers.includes(opt.option_letter);
								const isCorrectOption = opt.is_correct;

								const optionClass = hasSubmitted
									? isSelected && isCorrectOption
										? 'border-green-600 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
										: isSelected && !isCorrectOption
											? 'border-red-600 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
											: !isSelected && isCorrectOption
												? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
												: 'border-gray-300 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300'
									: isSelected
										? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
										: 'border-gray-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200';

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
										{hasSubmitted && (
											isCorrectOption && isSelected ? (
												<span className="text-green-600 font-bold ml-2 dark:text-green-300">✓</span>
											) : !isCorrectOption && isSelected ? (
												<span className="text-red-600 font-bold ml-2 dark:text-red-300">✗</span>
											) : null
										)}
									</label>
								);
							})}
						</div>
						{!hasSubmitted ? (
							<button
								onClick={() => handleSubmit(q.id)}
								className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
							>
								Submit
							</button>
						) : (
							<div className="mt-4 text-sm font-semibold">
								{isCorrect ? (
									<span className="text-green-600 dark:text-green-300">Correct!</span>
								) : (
									<span className="text-red-600 dark:text-red-300">Incorrect</span>
								)}
							</div>
						)}
					</div>
				);
			})}
			<div>
				<button
					onClick={() => setQuestions(shuffleArray([...questions]))}
					className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
				>
					Shuffle Questions
				</button>
			</div>
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={(page) => setCurrentPage(page)}
			/>
		</div>
	);
}
