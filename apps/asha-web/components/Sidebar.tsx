"use client";

import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ShieldCheck,
    UserPlus,
    Stethoscope,
    Users,
    ClipboardList,
    Settings,
    ChevronLeft,
    ChevronRight,
    MessageSquare
} from "lucide-react";

const SidebarContext = createContext({
    isOpen: true,
    toggle: () => { }
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const toggle = () => setIsOpen(!isOpen);
    return (
        <SidebarContext.Provider value={{ isOpen, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function Sidebar() {
    const { isOpen, toggle } = useSidebar();
    const pathname = usePathname();

    const menuItems = [
        {
            group: "Actions",
            items: [
                {
                    name: "AI Assistant",
                    href: "/",
                    icon: MessageSquare,
                    description: "Chat with BharatCare AI",
                    color: "text-indigo-400"
                },
                // {
                //     name: "New Registration",
                //     href: "/#register",
                //     icon: UserPlus,
                //     description: "Onboard new patient",
                //     color: "text-indigo-400"
                // },
                // {
                //     name: "Referral",
                //     href: "/#referral",
                //     icon: Stethoscope,
                //     description: "Create specialist referral",
                //     color: "text-indigo-400"
                // }
            ]
        },
        {
            group: "Records",
            items: [
                {
                    name: "Registered Patients",
                    href: "/patients",
                    icon: Users,
                    description: "View all patients",
                    color: "text-emerald-400"
                },
                {
                    name: "All Referrals",
                    href: "/referrals",
                    icon: ClipboardList,
                    description: "Track all referrals",
                    color: "text-amber-400"
                }
            ]
        }
    ];

    return (
        <aside
            className={`transition-all duration-500 ease-in-out border-r border-border-dark flex flex-col glass z-50 overflow-hidden ${isOpen ? "w-72" : "w-16"}`}
        >
            <div className="h-16 flex items-center px-4 border-b border-border-dark shrink-0">
                <Link href="/" className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-gemini-gradient p-1.5 rounded-xl gemini-glow shrink-0">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    {isOpen && (
                        <span className="font-bold tracking-tight text-lg gemini-gradient">BharatCare Link</span>
                    )}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
                {menuItems.map((group) => (
                    <div key={group.group} className="space-y-2">
                        {isOpen && (
                            <p className="px-2 text-[10px] font-bold text-muted-grey uppercase tracking-widest opacity-50">
                                {group.group}
                            </p>
                        )}
                        {group.items.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group hover:bg-white/5 ${pathname === item.href ? "bg-indigo-500/10 border border-indigo-500/20" : "border border-transparent"} ${!isOpen && 'justify-center'}`}
                            >
                                <item.icon size={20} className={`${pathname === item.href ? item.color : 'text-muted-grey'} group-hover:${item.color}`} />
                                {isOpen && (
                                    <div className="text-left overflow-hidden">
                                        <p className={`text-sm font-medium truncate ${pathname === item.href ? 'text-white' : 'text-muted-grey group-hover:text-white'}`}>
                                            {item.name}
                                        </p>
                                        <p className="text-[10px] text-muted-grey opacity-70 group-hover:opacity-100">
                                            {item.description}
                                        </p>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                ))}
            </div>

            <div className="p-3 border-t border-border-dark gap-2 flex flex-col">
                <button className={`w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group ${!isOpen && 'justify-center'}`}>
                    <Settings size={20} className="text-muted-grey group-hover:text-white" />
                    {isOpen && <span className="text-sm font-medium text-muted-grey group-hover:text-white font-geist-sans">Settings</span>}
                </button>

                <button
                    onClick={toggle}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group ${!isOpen && 'justify-center'}`}
                >
                    {isOpen ? <ChevronLeft size={20} className="text-muted-grey" /> : <ChevronRight size={20} className="text-muted-grey" />}
                    {isOpen && <span className="text-sm font-medium text-muted-grey group-hover:text-white font-geist-sans">Collapse Sidebar</span>}
                </button>
            </div>
        </aside>
    );
}
