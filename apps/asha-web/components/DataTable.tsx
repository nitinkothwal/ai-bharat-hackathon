"use client";

import React, { useState, useMemo } from "react";
import {
    Search,
    ChevronUp,
    ChevronDown,
    Filter,
    RefreshCcw,
    ArrowUpDown
} from "lucide-react";

interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title: string;
    description?: string;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    title,
    description,
    onRefresh,
    isLoading
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: "",
        direction: null
    });

    // Filtering logic
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            return Object.values(item).some((val) =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [data, searchTerm]);

    // Sorting logic
    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                    {description && <p className="text-sm text-muted-grey mt-1">{description}</p>}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-grey group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-charcoal/50 border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all"
                        />
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 bg-charcoal/50 border border-border-dark rounded-xl hover:bg-white/5 transition-all disabled:opacity-50 group"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={18} className={`text-muted-grey group-hover:text-white ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-charcoal/30 border border-border-dark rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-dark bg-white/[0.02]">
                                {columns.map((col) => (
                                    <th
                                        key={col.header}
                                        className="py-4 px-6 text-[10px] font-bold text-muted-grey uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                                        onClick={() => col.sortable !== false && handleSort(col.accessorKey as string)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.header}
                                            {col.sortable !== false && (
                                                <ArrowUpDown size={12} className={sortConfig.key === col.accessorKey ? 'text-indigo-400' : 'text-muted-grey/30'} />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark/50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {columns.map((_, j) => (
                                            <td key={j} className="py-4 px-6">
                                                <div className="h-4 bg-white/5 rounded w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : sortedData.length > 0 ? (
                                sortedData.map((item, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        {columns.map((col) => (
                                            <td key={col.header} className="py-4 px-6 text-sm text-white/90">
                                                {col.cell ? col.cell(item) : item[col.accessorKey]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="py-20 text-center text-muted-grey text-sm">
                                        No matching records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
