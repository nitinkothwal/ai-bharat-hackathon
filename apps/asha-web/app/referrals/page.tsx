"use client";

import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import {
    Clock,
    ArrowRight,
    Stethoscope,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

interface Referral {
    ReferralID: string;
    PatientID: string;
    PatientName: string;
    Specialist: string;
    Priority: "Low" | "Medium" | "High" | "Urgent";
    Status: "Pending" | "Scheduled" | "Consulted" | "Cancelled";
    CreatedAt: string;
}

const MOCK_REFERRALS: Referral[] = [
    {
        ReferralID: "REF#A123B456",
        PatientID: "PAT#8F2A1CBB",
        PatientName: "Arun Shourie",
        Specialist: "Cardiologist",
        Priority: "High",
        Status: "Pending",
        CreatedAt: "2024-03-08T11:20:00Z"
    },
    {
        ReferralID: "REF#C789D012",
        PatientID: "PAT#9B3C2DDE",
        PatientName: "Priyanka Sharma",
        Specialist: "OB-GYN",
        Priority: "Medium",
        Status: "Scheduled",
        CreatedAt: "2024-03-08T09:45:00Z"
    },
    {
        ReferralID: "REF#E345F678",
        PatientID: "PAT#1A2B3C4D",
        PatientName: "Vikram Malhotra",
        Specialist: "Endocrinologist",
        Priority: "Urgent",
        Status: "Pending",
        CreatedAt: "2024-03-07T17:10:00Z"
    },
    {
        ReferralID: "REF#G901H234",
        PatientID: "PAT#Z9Y8X7W6",
        PatientName: "Anjali Deshmukh",
        Specialist: "Orthopedic",
        Priority: "Low",
        Status: "Consulted",
        CreatedAt: "2024-03-07T12:00:00Z"
    }
];

export default function ReferralsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<Referral[]>([]);

    const fetchReferrals = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/records?type=referrals");
            const result = await res.json();
            if (result.success) {
                setData(result.items);
            }
        } catch (error) {
            console.error("Failed to fetch referrals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, []);

    const handleRefresh = () => {
        fetchReferrals();
    };

    const columns = [
        {
            header: "Referral ID",
            accessorKey: "ReferralID",
            cell: (r: Referral) => (
                <span className="font-mono text-amber-400 font-bold">{r.ReferralID}</span>
            )
        },
        {
            header: "Patient",
            accessorKey: "PatientName",
            sortable: true,
            cell: (r: Referral) => (
                <div className="flex flex-col">
                    <span className="font-medium">{r.PatientName}</span>
                    <span className="text-[10px] text-muted-grey font-mono">{r.PatientID}</span>
                </div>
            )
        },
        {
            header: "Specialist",
            accessorKey: "Specialist",
            sortable: true,
            cell: (r: Referral) => (
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                        <Stethoscope size={12} className="text-indigo-400" />
                    </div>
                    <span>{r.Specialist}</span>
                </div>
            )
        },
        {
            header: "Priority",
            accessorKey: "Priority",
            sortable: true,
            cell: (r: Referral) => {
                const colors = {
                    Low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    Medium: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    Urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                };
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${colors[r.Priority]}`}>
                        {r.Priority}
                    </span>
                );
            }
        },
        {
            header: "Status",
            accessorKey: "Status",
            sortable: true,
            cell: (r: Referral) => {
                const icons = {
                    Pending: <AlertCircle size={14} className="text-amber-400" />,
                    Scheduled: <Clock size={14} className="text-blue-400" />,
                    Consulted: <CheckCircle2 size={14} className="text-emerald-400" />,
                    Cancelled: <AlertCircle size={14} className="text-muted-grey" />
                };
                return (
                    <div className="flex items-center gap-2">
                        {icons[r.Status]}
                        <span className="text-xs uppercase tracking-wider font-bold">{r.Status}</span>
                    </div>
                );
            }
        },
        {
            header: "Timeline",
            accessorKey: "CreatedAt",
            sortable: true,
            cell: (r: Referral) => (
                <span className="text-muted-grey text-xs">
                    {new Date(r.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(r.CreatedAt).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="py-6">
            <DataTable
                title="Specialist Referrals"
                description="List of all referrals generated by BharatCare."
                data={data}
                columns={columns}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />
        </div>
    );
}
