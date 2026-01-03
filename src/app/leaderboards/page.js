"use client";

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

export default function LeaderboardsPage() {
	const [leaderboard, setLeaderboard] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const res = await fetch('/api/test-results');
				if (!res.ok) {
					throw new Error('Failed to fetch leaderboard data.');
				}
				const data = await res.json();
				setLeaderboard(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};

		fetchLeaderboard();
	}, []);

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto p-4 sm:p-6">
				<div className="text-center mb-8">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading leaderboard...</p>
				</div>
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="space-y-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="flex items-center space-x-4">
								<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
								<div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
								<div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-4xl mx-auto p-4 sm:p-6">
				<div className="text-center">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<p className="text-red-600 font-medium">Error: {error}</p>
						<button
							onClick={() => window.location.reload()}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto p-4 sm:p-8 pt-24 pb-20">
			<div className="text-center mb-20 relative">
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-400/20 blur-[100px] -z-10" />
				<div className="relative inline-block mb-8">
					<div className="p-6 bg-white rounded-[2.5rem] shadow-2xl glass-morphism animate-bounce-slow">
						<Trophy className="w-24 h-24 mx-auto text-yellow-500 drop-shadow-2xl" />
					</div>
					<div className="absolute -top-4 -right-4 px-4 py-2 bg-rose-600 rounded-2xl shadow-xl flex items-center justify-center text-white text-sm font-black tracking-widest border-4 border-white">
						STREAK
					</div>
				</div>
				<h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
					Path to <span className="premium-text-gradient">Mastery</span>
				</h1>
				<p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
					Celebrate the elite performers of the CEH community. Track your ascent and aim for the summit.
				</p>
			</div>

			<div className="space-y-6">
				<div className="flex items-center justify-between mb-8 px-4">
					<h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Global Rankings</h2>
					<div className="text-sm font-bold text-slate-400">{leaderboard.length} COMPETITORS</div>
				</div>

				{leaderboard.length > 0 ? (
					<div className="divide-y divide-gray-100">
						{leaderboard.map((entry, index) => {
							const getRankBadge = (rank) => {
								if (rank === 0) return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', text: '1', label: '1st' };
								if (rank === 1) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', text: '2', label: '2nd' };
								if (rank === 2) return { bg: 'bg-gradient-to-r from-orange-400 to-orange-600', text: '3', label: '3rd' };
								return { bg: 'bg-gray-100', text: `${rank + 1}`, label: `${rank + 1}th` };
							};

							const rankBadge = getRankBadge(index);
							const percentage = Math.round((entry.score / 50) * 100);

							return (
								<div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
									<div className="flex items-center space-x-4">
										<div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${rankBadge.bg}`}>
											{rankBadge.text}
										</div>
										<div className="flex-1">
											<div className="flex items-center space-x-3">
												<h3 className="text-lg font-semibold text-gray-900">{entry.user.name}</h3>
												<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
													{rankBadge.label}
												</span>
											</div>
											<div className="flex items-center space-x-4 mt-2">
												<div className="flex items-center space-x-2">
													<span className="text-2xl font-bold text-blue-600">{entry.score}</span>
													<span className="text-gray-500">/ 50</span>
												</div>
												<div className="flex items-center space-x-2">
													<span className="text-sm text-gray-500">Score:</span>
													<span className="text-sm font-semibold text-green-600">{percentage}%</span>
												</div>
											</div>
											<div className="mt-2">
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
														style={{ width: `${percentage}%` }}
													></div>
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-gray-500">
												{new Date(entry.createdAt).toLocaleDateString()}
											</div>
											<div className="text-xs text-gray-400">
												{new Date(entry.createdAt).toLocaleTimeString()}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="p-12 text-center">
						<div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Trophy className="w-12 h-12 text-gray-400" />
						</div>
						<h3 className="text-xl font-semibold text-gray-900 mb-2">No scores recorded yet</h3>
						<p className="text-gray-500 mb-6">Be the first to take a test and claim the top spot!</p>
						<a
							href="/test"
							className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
						>
							Take Your First Test
						</a>
					</div>
				)}
			</div>
		</div>
	);
}