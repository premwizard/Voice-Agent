"use client"
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, FileText, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Analytics', href: '/dashboard/analytics', icon: LayoutDashboard },
        { name: 'Prompts', href: '/dashboard/prompts', icon: FileText },
        { name: 'Traces', href: '/dashboard/traces', icon: Activity },
    ];

    return (
        <div className="flex h-screen bg-[#050505] text-white">
            <aside className="w-64 border-r border-white/10 bg-[#0A0A0A] p-6 flex flex-col">
                <Link href="/" className="mb-8 block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        AI Platform
                    </h1>
                </Link>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                    isActive 
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1 overflow-auto bg-[#050505]">
                {children}
            </main>
        </div>
    );
}
