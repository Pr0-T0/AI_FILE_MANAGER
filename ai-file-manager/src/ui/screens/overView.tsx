import { motion } from "framer-motion";

export default function Overview() {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none bg-zinc-950 text-gray-700">
      {/* App Name */}
      <motion.h1
        className="text-[7.5rem] font-extrabold tracking-tight text-gray-600"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        LINC
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-gray-500 text-base mt-2 text-center max-w-xl"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        An AI-powered file manager for searching, organizing, and reasoning
        over your filesystem.
      </motion.p>

      {/* Divider */}
      <motion.div
        className="w-24 h-px bg-zinc-800 my-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      />

      {/* Links */}
      <motion.div
        className="flex gap-8 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <span className="hover:text-blue-400 cursor-pointer transition">
          Learn more
        </span>
        <span className="hover:text-blue-400 cursor-pointer transition">
          Release notes
        </span>
        <span className="hover:text-blue-400 cursor-pointer transition">
          Documentation
        </span>
      </motion.div>
    </div>
  );
}
