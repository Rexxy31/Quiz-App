"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AppLayout({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(savedTheme);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowIcon(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  if (!isMounted) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-sans relative bg-white dark:bg-gray-900 text-black dark:text-white">
      {showIcon ? (
        <motion.div
          initial={{ top: 16, left: "50%", x: "-50%" }}
          animate={{ top: 16, left: "auto", right: 16, x: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed z-40"
        >
          <button
            className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ top: 16, left: "auto", right: 16, x: 0 }}
          animate={{ top: 16, left: "50%", x: "-50%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed z-40 block"
        >
          <SlideTabs scrolled={showIcon} />
        </motion.div>
      )}

      {menuOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 right-0 z-50 w-32 bg-white dark:bg-black shadow-lg p-6 space-y-6 md:hidden"
        >
          <button
            className="text-black dark:text-white text-xl absolute top-4 right-4"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
          <nav className="flex flex-col space-y-4 text-lg">
            <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/Learn" onClick={() => setMenuOpen(false)}>Learn</Link>
            <Link href="/Test" onClick={() => setMenuOpen(false)}>Test</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            <Link href="/leaderboards" onClick={() => setMenuOpen(false)}>Leaderboards</Link>
          </nav>
        </motion.div>
      )}

      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition"
        >
          ↑
        </motion.button>
      )}

      <motion.button
        onClick={toggleTheme}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </motion.button>

      <main className="pt-28 px-6">{children}</main>
    </div>
  );
}

function SlideTabs({ scrolled }) {
  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });
  return (
    <ul
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
      className={`relative mx-auto flex min-w-0 ${scrolled ? "max-w-full rounded-full border-2 border-black bg-white dark:bg-gray-800 dark:border-white" : "w-full rounded-none bg-black p-2 dark:bg-white"} sm:w-fit sm:rounded-full sm:bg-white sm:p-1 sm:border-2 sm:border-black overflow-x-auto no-scrollbar whitespace-nowrap`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <NavTab scrolled={scrolled} setPosition={setPosition} href="/">Home</NavTab>
      <NavTab scrolled={scrolled} setPosition={setPosition} href="/Learn">Learn</NavTab>
      <NavTab scrolled={scrolled} setPosition={setPosition} href="/Test">Test</NavTab>
      <NavTab scrolled={scrolled} setPosition={setPosition} href="/contact">Contact</NavTab>
      <NavTab scrolled={scrolled} setPosition={setPosition} href="/leaderboards">Leaderboards</NavTab>
      <Cursor position={position} />
    </ul>
  );
}

function NavTab({ children, setPosition, href, scrolled }) {
  const ref = React.useRef(null);
  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref?.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({ left: ref.current.offsetLeft, width, opacity: 1 });
      }}
      className={`relative z-10 inline-block cursor-pointer px-3 py-1.5 text-xs uppercase min-w-0 ${scrolled ? "text-black" : "text-white"} md:px-5 md:py-3 md:text-base md:text-black md:hover:text-white`}
    >
      <Link href={href}>{children}</Link>
    </li>
  );
}

function Cursor({ position }) {
  return <motion.li animate={{ ...position }} className="absolute z-0 h-7 rounded-full bg-black md:h-12" />;
}
