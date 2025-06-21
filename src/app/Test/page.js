"use client";

import { useEffect, useState } from 'react';
import Pagination from "@/app/components/Pagination";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  const { data: session, status } = useSession();
  const router = useRouter();

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

      const shuffled = shuffleArray(normalized).slice(0, 50);
      setQuestions(shuffled);
    };

    if (status === 'authenticated') {
      fetchQuestions();
    }
  }, [status]);

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

  const handleTestSubmit = async () => {
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
  
  if (status === 'loading') {
    return <div className="text-center mt-20">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    return null; // or a login prompt
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">CEH Practice Test</h1>

      {submitted && results && (
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Test Complete!</h2>
          <p className="text-4xl font-extrabold text-blue-600">
            {results.score} / {results.total}
          </p>
          <p className="text-lg mt-2">
            You scored {Math.round((results.score / results.total) * 100)}%.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!submitted && questions.length > 0 && (
        <div className="space-y-4">
          {currentQuestions.map((q, index) => {
            const userAnswers = answers[q.id] || [];
            return (
              <div key={q.id} className="bg-white shadow-lg rounded-xl p-5">
                <h2 className="text-lg mb-4">
                  {(currentPage - 1) * ItemsPerPage + index + 1}. {q.question_text}
                </h2>
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
      
      {!submitted && (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />

          <div className="text-center">
            <button
              onClick={handleTestSubmit}
              className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
            >
              Submit Test
            </button>
          </div>
        </>
      )}
    </div>
  );
}
