"use client";

import { useEffect, useState } from 'react';
import Pagination from "@/app/components/Pagination";

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default function TestPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
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

      const shuffled = shuffleArray(normalized).slice(0, 50); // ✅ 50 questions
      setQuestions(shuffled);
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

  const handleTestSubmit = () => {
    let correct = 0;

    questions.forEach(q => {
      const userAnswers = answers[q.id] || [];
      const correctAnswers = q.options.filter(o => o.is_correct).map(o => o.option_letter);

      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every(ans => correctAnswers.includes(ans));

      if (isCorrect) correct++;
    });

    setResults({
      total: questions.length,
      correct,
      incorrect: questions.length - correct,
    });

    setSubmitted(true);
  };

  return (
  <div className="max-w-6xl mx-auto p-6 space-y-6">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Test Mode (50 Random Questions)
      </h1>
    </div>

    {currentQuestions.map((q, index) => {
      const userAnswers = answers[q.id] || [];
      const correctAnswers = q.options.filter(o => o.is_correct).map(o => o.option_letter);
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every(ans => correctAnswers.includes(ans));

      return (
        <div key={q.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5">
          <h2 className="text-lg mb-4 text-gray-900 dark:text-white">
            {(currentPage - 1) * ItemsPerPage + index + 1}. {q.question_text}
          </h2>
          <div className="space-y-2">
            {q.options.map((opt) => {
              const isSelected = userAnswers.includes(opt.option_letter);
              const isCorrectOption = opt.is_correct;

              const optionClass = submitted
                ? isSelected && isCorrectOption
                  ? 'border-green-600 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                  : isSelected && !isCorrectOption
                    ? 'border-red-600 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                    : !isSelected && isCorrectOption
                      ? 'border-green-400 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                      : 'border-gray-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                : isSelected
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                  : 'border-gray-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200';

              return (
                <label
                  key={opt.id}
                  className={`flex items-center p-2 rounded border transition-colors cursor-pointer ${optionClass}`}
                >
                  <input
                    type="checkbox"
                    disabled={submitted}
                    name={`question-${q.id}`}
                    value={opt.option_letter}
                    checked={isSelected}
                    onChange={() => handleAnswer(q.id, opt.option_letter)}
                    className="mr-3"
                  />
                  <span className="flex-grow">{opt.option_letter}. {opt.option_text}</span>
                  {submitted && (
                    isCorrectOption && isSelected ? (
                      <span className="text-green-600 dark:text-green-300 font-bold ml-2">✓</span>
                    ) : !isCorrectOption && isSelected ? (
                      <span className="text-red-600 dark:text-red-300 font-bold ml-2">✗</span>
                    ) : null
                  )}
                </label>
              );
            })}
          </div>
        </div>
      );
    })}

    {/* Pagination */}
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={(page) => setCurrentPage(page)}
    />

    {/* Submit Test Button */}
    {!submitted && (
      <div className="text-center">
        <button
          onClick={handleTestSubmit}
          className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
        >
          Submit Test
        </button>
      </div>
    )}

    {/* Results */}
    {submitted && results && (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Test Results</h2>
        <p className="mt-4 text-lg text-green-700 dark:text-green-300 font-semibold">
          ✅ Correct: {results.correct} / {results.total}
        </p>
        <p className="text-lg text-red-600 dark:text-red-300 font-semibold">
          ❌ Incorrect: {results.incorrect}
        </p>
      </div>
    )}
  </div>
);
}
