"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import { Shield, User, Settings } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function AppLayout({ children }) {
	const [isMounted, setIsMounted] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const pathname = usePathname();
	const { data: session, status } = useSession();

	useEffect(() => {
		setIsMounted(true);

		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 200);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	if (!isMounted) return null;

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleNavClick = () => {
		setMenuOpen(false);
	};

	const navLinks = [
		{ href: "/", label: "Home" },
		{ href: "/learn", label: "Learn" },
		{ href: "/test", label: "Test" },
		{ href: "/contact", label: "Contact" },
		{ href: "/leaderboards", label: "Leaderboards" },
	];

	return (
		<div className="min-h-screen bg-gray-100 font-sans relative">
			{/* Navigation Bar */}
			<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo */}
						<div className="flex-shrink-0">
							<Link href="/" className="flex items-center space-x-2 text-xl font-bold text-gray-800">
								<Shield className="w-7 h-7 text-blue-600" />
								<span>CEH Quiz</span>
							</Link>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-1">
							{navLinks.map(({ href, label }) => (
								<Link
									key={href}
									href={href}
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
										pathname === href
											? 'bg-blue-100 text-blue-700'
											: 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
									}`}
								>
									{label}
								</Link>
							))}
							
							{/* Admin Link - Only show if user is admin */}
							{status === 'authenticated' && session.user.role === 'ADMIN' && (
								<Link 
									href="/admin" 
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
										pathname === '/admin'
											? 'bg-purple-100 text-purple-700'
											: 'bg-purple-600 text-white hover:bg-purple-700'
									}`}
								>
									<Settings className="w-4 h-4" />
									<span>Admin</span>
								</Link>
							)}
						</div>

						{/* User Menu */}
						<div className="hidden md:flex items-center space-x-3">
							{status === 'authenticated' ? (
								<div className="relative">
									<button
										onClick={() => setUserMenuOpen(!userMenuOpen)}
										className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
									>
										<User className="w-4 h-4" />
										<span>{session.user.name}</span>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</button>
									
									{userMenuOpen && (
										<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
											<div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
												{session.user.role === 'ADMIN' ? 'Administrator' : 'User'}
											</div>
											<button
												onClick={() => { signOut(); setUserMenuOpen(false); }}
												className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
											>
												Sign out
											</button>
										</div>
									)}
								</div>
							) : (
								<Link
									href="/login"
									className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
								>
									Login
								</Link>
							)}
						</div>

						{/* Mobile Menu Button */}
						<div className="md:hidden flex items-center">
							<button
								className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
								onClick={() => setMenuOpen(!menuOpen)}
								aria-label="Open main menu"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{menuOpen && (
					<div className="md:hidden border-t border-gray-200">
						<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
							{navLinks.map(({ href, label }) => (
								<Link
									key={href}
									href={href}
									onClick={handleNavClick}
									className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
										pathname === href
											? 'bg-blue-100 text-blue-700'
											: 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
									}`}
								>
									{label}
								</Link>
							))}
							{status === 'authenticated' ? (
								<>
									{session.user.role === 'ADMIN' && (
										<Link 
											href="/admin" 
											onClick={handleNavClick} 
											className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${
												pathname === '/admin'
													? 'bg-purple-100 text-purple-700'
													: 'bg-purple-600 text-white hover:bg-purple-700'
											}`}
										>
											<Settings className="w-4 h-4" />
											<span>Admin</span>
										</Link>
									)}
									<div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200 mt-2 pt-2">
										Welcome, {session.user.name}
									</div>
									<button 
										onClick={() => { signOut(); handleNavClick(); }} 
										className="w-full text-left block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 text-red-600 hover:bg-red-50"
									>
										Sign out
									</button>
								</>
							) : (
								<Link
									href="/login"
									onClick={handleNavClick}
									className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
								>
									Login
								</Link>
							)}
						</div>
					</div>
				)}
			</nav>

			{/* Scroll to Top Button */}
			{showScrollTop && (
				<button
					onClick={scrollToTop}
					className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-300"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
				</button>
			)}

			{/* Main Content */}
			<main className="pt-20 px-4 sm:px-6 lg:px-8">{children}</main>
		</div>
	);
}
