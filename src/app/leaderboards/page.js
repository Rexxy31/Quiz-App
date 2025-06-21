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
		return <div className="text-center mt-20">Loading leaderboard...</div>;
	}

	if (error) {
		return <div className="text-center mt-20 text-red-600">Error: {error}</div>;
	}

	return (
		<div className="max-w-4xl mx-auto p-4 sm:p-6">
			<div className="text-center mb-8">
				<Trophy className="w-16 h-16 mx-auto text-yellow-500" />
				<h1 className="text-4xl font-extrabold text-gray-900 mt-4">
					Top Performers
				</h1>
				<p className="text-lg text-gray-600 mt-2">
					See who is leading the pack in the CEH practice tests.
				</p>
			</div>

			<div className="bg-white rounded-lg shadow-lg overflow-hidden">
				<table className="min-w-full">
					<thead className="bg-gray-800 text-white">
						<tr>
							<th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
								Rank
							</th>
							<th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
								Name
							</th>
							<th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
								Score
							</th>
							<th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
								Date
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{leaderboard.length > 0 ? (
							leaderboard.map((entry, index) => (
								<tr key={entry.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{index + 1}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
										{entry.user.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
										{entry.score}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(entry.createdAt).toLocaleDateString()}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan="4" className="text-center py-10 text-gray-500">
									No scores recorded yet. Be the first!
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}