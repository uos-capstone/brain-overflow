import { motion } from 'framer-motion';

const variants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
};

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="w-full h-full"
    >
        {children}
    </motion.div>
);