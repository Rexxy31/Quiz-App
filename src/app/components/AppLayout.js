"use client";

import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { usePathname } from 'next/navigation';
import { Shield, User, Settings, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useExam } from '../contexts/ExamContext';

export default function AppLayout({ children }) {
	const [isMounted, setIsMounted] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const { isExamActive } = useExam();
	const mobileMenuRef = useRef(null);
	const menuButtonRef = useRef(null);

	useEffect(() => {
		setIsMounted(true);

		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 200);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Handle click outside mobile menu
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuOpen &&
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target) &&
				menuButtonRef.current &&
				!menuButtonRef.current.contains(event.target)) {
				setMenuOpen(false);
			}
		};

		// Handle escape key
		const handleEscapeKey = (event) => {
			if (event.key === 'Escape' && menuOpen) {
				setMenuOpen(false);
			}
		};

		// Prevent body scroll when menu is open
		if (menuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscapeKey);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscapeKey);
			document.body.style.overflow = 'unset';
		};
	}, [menuOpen]);

	if (!isMounted) return null;

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleNavClick = () => {
		if (isExamActive) {
			return; // Prevent navigation during exam
		}
		setMenuOpen(false);
		setUserMenuOpen(false);
	};

	const handleMenuToggle = () => {
		setMenuOpen(!menuOpen);
		setUserMenuOpen(false);
	};

	const navLinks = [
		{ href: "/", label: "Home" },
		{ href: "/learn", label: "Learn" },
		{ href: "/test", label: "Exam" },
		{ href: "/contact", label: "Contact" },
		{ href: "/leaderboards", label: "Leaderboards" },
	];

	return (
		<div className="min-h-screen relative">
			{/* Navbar and Content background */}
			<div className="fixed inset-0 bg-slate-50 -z-10" />
			{/* Navigation Bar */}
			<nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl glass-morphism rounded-2xl border-white/40 shadow-2xl">
				<div className="px-6 sm:px-8">
					<div className="flex justify-between items-center h-20">
						{/* Logo */}
						<div className="flex-shrink-0">
							<Link href="/" className="flex items-center space-x-3 group">
								<div className="p-2 bg-indigo-600 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-200">
									<Shield className="w-6 h-6 text-white" />
								</div>
								<span className="text-2xl font-black text-slate-900 tracking-tighter">CEH<span className="text-indigo-600">QUIZ</span></span>
							</Link>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-2">
							{navLinks.map(({ href, label }) => (
								<Link
									key={href}
									href={isExamActive ? '#' : href}
									onClick={isExamActive ? (e) => e.preventDefault() : handleNavClick}
									className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${pathname === href
										? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
										: isExamActive
											? 'text-slate-300 cursor-not-allowed'
											: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
										}`}
									title={isExamActive ? 'Navigation disabled during exam' : ''}
								>
									{label}
								</Link>
							))}

							{/* Admin Link - Only show if user is admin */}
							{status === 'authenticated' && session.user.role === 'ADMIN' && (
								<Link
									href={isExamActive ? '#' : "/admin"}
									onClick={isExamActive ? (e) => e.preventDefault() : handleNavClick}
									className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${pathname === '/admin'
										? 'bg-purple-600 text-white shadow-lg shadow-purple-100'
										: isExamActive
											? 'opacity-50 cursor-not-allowed'
											: 'bg-purple-50 text-purple-700 hover:bg-purple-100'
										}`}
									title={isExamActive ? 'Navigation disabled during exam' : ''}
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
								ref={menuButtonRef}
								className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								onClick={handleMenuToggle}
								aria-label={menuOpen ? "Close main menu" : "Open main menu"}
								aria-expanded={menuOpen}
							>
								{menuOpen ? (
									<X className="w-6 h-6" />
								) : (
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
									</svg>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{menuOpen && (
					<>
						{/* Backdrop */}
						<div
							className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fade-in"
							onClick={() => setMenuOpen(false)}
						/>

						{/* Mobile Menu */}
						<div
							ref={mobileMenuRef}
							className="md:hidden fixed top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 transform transition-all duration-300 ease-in-out animate-slide-down"
						>
							<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
								{navLinks.map(({ href, label }) => (
									<Link
										key={href}
										href={isExamActive ? '#' : href}
										onClick={isExamActive ? (e) => e.preventDefault() : handleNavClick}
										className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${pathname === href
											? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
											: isExamActive
												? 'text-gray-400 cursor-not-allowed border-l-4 border-transparent'
												: 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-l-4 border-transparent'
											}`}
										title={isExamActive ? 'Navigation disabled during exam' : ''}
									>
										{label}
									</Link>
								))}
								{status === 'authenticated' ? (
									<>
										{session.user.role === 'ADMIN' && (
											<Link
												href={isExamActive ? '#' : "/admin"}
												onClick={isExamActive ? (e) => e.preventDefault() : handleNavClick}
												className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${pathname === '/admin'
													? 'bg-purple-100 text-purple-700'
													: isExamActive
														? 'bg-purple-400 text-white cursor-not-allowed'
														: 'bg-purple-600 text-white hover:bg-purple-700'
													}`}
												title={isExamActive ? 'Navigation disabled during exam' : ''}
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
											className="w-full text-left block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 text-red-600 hover:bg-red-50 transform hover:scale-105 active:scale-95"
										>
											Sign out
										</button>
									</>
								) : (
									<Link
										href="/login"
										onClick={handleNavClick}
										className="block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 active:scale-95"
									>
										Login
									</Link>
								)}
							</div>
						</div>
					</>
				)}
			</nav>

			{/* Scroll to Top Button */}
			{showScrollTop && (
				<button
					onClick={scrollToTop}
					className="fixed bottom-10 right-10 z-[60] w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_35px_rgba(79,70,229,0.5)] transition-all duration-300 hover:-translate-y-2 active:scale-90"
				>
					<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
				</button>
			)}

			{/* Main Content */}
			<main className="pt-20 px-4 sm:px-6 lg:px-8">{children}</main>

			{/* Custom Animations */}
			<style jsx global>{`
				@keyframes fade-in {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes slide-down {
					from { 
						transform: translateY(-100%);
						opacity: 0;
					}
					to { 
						transform: translateY(0);
						opacity: 1;
					}
				}
				.animate-fade-in {
					animation: fade-in 0.3s ease-out;
				}
				.animate-slide-down {
					animation: slide-down 0.3s ease-out;
				}
			`}</style>
		</div>
	);
}
