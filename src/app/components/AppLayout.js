"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export default function AppLayout({ children }) {
  const [showIcon, setShowIcon] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowIcon(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-indigo-50 font-sans relative">
      {/* Floating Nav Icon (Top Right) */}
      {showIcon ? (
        <motion.div
          initial={{ top: 16, left: "50%", x: "-50%" }}
          animate={{ top: 16, left: "auto", right: 16, x: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed z-40"
        >
          <button
            className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition"
            onClick={() => alert("Expand nav or open drawer")}
          >
            ☰
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ top: 16, left: "auto", right: 16, x: 0 }}
          animate={{ top: 16, left: "50%", x: "-50%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed z-40"
        >
          <SlideTabs />
        </motion.div>
      )}

      {/* Scroll to Top Button */}
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

      {/* Main Content */}
      <main className="pt-28 px-6">{children}</main>
    </div>
  );
}

function SlideTabs() {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      onMouseLeave={() => {
        setPosition((pv) => ({
          ...pv,
          opacity: 0,
        }));
      }}
      className="relative mx-auto flex w-fit rounded-full border border-black bg-white p-1"
    >
      <NavTab setPosition={setPosition} href="/">Home</NavTab>
      <NavTab setPosition={setPosition} href="/quiz">Quiz</NavTab>
      <NavTab setPosition={setPosition} href="/about">About</NavTab>
      <NavTab setPosition={setPosition} href="/contact">Contact</NavTab>

      <Cursor position={position} />
    </ul>
  );
}

function NavTab({ children, setPosition, href }) {
  const ref = useRef(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref?.current) return;

        const { width } = ref.current.getBoundingClientRect();

        setPosition({
          left: ref.current.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      className="relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase text-white mix-blend-difference md:px-5 md:py-3 md:text-base"
    >
      <Link href={href}>{children}</Link>
    </li>
  );
}

function Cursor({ position }) {
  return (
    <motion.li
      animate={{ ...position }}
      className="absolute z-0 h-7 rounded-full bg-black md:h-12"
    />
  );
}