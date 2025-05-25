"use client";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Quiz App</h1>
      <p className="text-lg text-gray-700 mb-6">
        Test your knowledge with 50 random questions!
      </p>
      <a
        href="/test"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Start Test
      </a>
    </div>
  );
}
