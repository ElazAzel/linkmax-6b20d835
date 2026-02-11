import { motion } from 'framer-motion';
import { ArrowUpRight, Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PremiumFooter = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-black text-white pt-32 pb-12 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-neutral-900 to-black pointer-events-none" />

            <div className="container relative z-10 px-4 mx-auto flex flex-col items-center">

                {/* Massive CTA */}
                <div className="w-full text-center mb-32">
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-[12vw] font-black leading-[0.8] tracking-tighter mb-8"
                    >
                        START NOW
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Button className="h-16 px-10 rounded-full text-xl font-bold bg-white text-black hover:bg-neutral-200 transition-transform hover:scale-105 active:scale-95">
                            Get Your Page <ArrowUpRight className="ml-2 w-6 h-6" />
                        </Button>
                    </motion.div>
                </div>

                {/* Footer Links Grid */}
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-12 mb-24 border-t border-white/10 pt-16">
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-lg mb-2">Product</h4>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Features</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Pricing</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Showcase</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Changelog</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-lg mb-2">Company</h4>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">About</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Careers</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Blog</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Contact</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-lg mb-2">Legal</h4>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="text-neutral-400 hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-lg mb-2">Socials</h4>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><Github className="w-5 h-5" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><Instagram className="w-5 h-5" /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="w-full flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-neutral-500 text-sm">
                    <p>&copy; {currentYear} lnkmx. All rights reserved.</p>
                    <p className="mt-2 md:mt-0 font-mono text-xs uppercase tracking-widest">Designed for the future</p>
                </div>
            </div>
        </footer>
    );
};
