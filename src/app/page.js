"use client";

import { Shield, Lock, Target } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-4xl mx-auto p-8 text-center">

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">CEH Quiz App</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Master the Certified Ethical Hacker (CEH) certification with our comprehensive practice tests and learning modules.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/learn"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Study Mode
          </a>
          <a
            href="/Test"
            className="inline-block px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-50 transition-transform transform hover:scale-105"
          >
            Practice Test
          </a>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto p-8 mt-12">
        <div className="grid md:grid-cols-3 gap-8 text-center">

          <div className="p-6 bg-white rounded-xl shadow-md">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Ethical Hacking</h3>
            <p className="text-gray-500">Learn penetration testing, vulnerability assessment, and security analysis techniques.</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <Lock className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Security Fundamentals</h3>
            <p className="text-gray-500">Master network security, cryptography, and threat modeling concepts.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md">
            <Target className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Real-world Scenarios</h3>
            <p className="text-gray-500">Practice with scenarios that mirror actual CEH exam questions and real-world challenges.</p>
          </div>

        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Prepare for your CEH certification with confidence
        </p>
      </div>
    </div>
  );
}
