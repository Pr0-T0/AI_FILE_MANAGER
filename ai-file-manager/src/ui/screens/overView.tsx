import { motion } from "framer-motion";

export default function Overview() {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none bg-zinc-950 text-gray-700">
      {/* App Name */}
      <motion.h1
        className="text-[8rem] font-extrabold text-gray-700 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Dhwani
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-gray-500 text-lg mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Your AI-powered file manager
      </motion.p>

      {/* Links like Learn More / Release Notes */}
      <motion.div
        className="flex gap-6 mt-6 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <a
          href="#"
          className="text-blue-400 hover:underline cursor-pointer"
        >
          Learn More
        </a>
        <a
          href="#"
          className="text-blue-400 hover:underline cursor-pointer"
        >
          Release Notes
        </a>
        <a
          href="#"
          className="text-blue-400 hover:underline cursor-pointer"
        >
          Documentation
        </a>
      </motion.div>
    </div>
  );
}
