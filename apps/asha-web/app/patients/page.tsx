"use client";

import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { Badge } from "lucide-react";

interface Patient {
    PatientID: string;
    Name: string;
    Age: number;
    Condition: string;
    Status: "Active" | "Follow-up" | "Completed" | "Critical";
    CreatedAt: string;
}

const MOCK_PATIENTS: Patient[] = [
    {
        PatientID: "PAT#8F2A1CBB",
        Name: "Arun Shourie",
        Age: 45,
        Condition: "Chronic Hypertension",
        Status: "Active",
        CreatedAt: "2024-03-08T10:00:00Z"
    },
    {
        PatientID: "PAT#9B3C2DDE",
        Name: "Priyanka Sharma",
        Age: 32,
        Condition: "Post-partum Recovery",
        Status: "Follow-up",
        CreatedAt: "2024-03-08T09:15:00Z"
    },
    {
        PatientID: "PAT#1A2B3C4D",
        Name: "Vikram Malhotra",
        Age: 58,
        Condition: "Type 2 Diabetes Control",
        Status: "Critical",
        CreatedAt: "2024-03-07T16:45:00Z"
    },
    {
        PatientID: "PAT#E5F6G7H8",
        Name: "Siddharth Rao",
        Age: 29,
        Condition: "Acute Bronchitis",
        Status: "Completed",
        CreatedAt: "2024-03-07T14:20:00Z"
    },
    {
        PatientID: "PAT#Z9Y8X7W6",
        Name: "Anjali Deshmukh",
        Age: 64,
        Condition: "Osteoarthritis Checkup",
        Status: "Follow-up",
        CreatedAt: "2024-03-07T11:30:00Z"
    }
];

export default function PatientsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<Patient[]>([]);

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/records?type=patients");
            const result = await res.json();
            if (result.success) {
                setData(result.items);
            }
        } catch (error) {
            console.error("Failed to fetch patients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleRefresh = () => {
        fetchPatients();
    };

    const columns = [
        {
            header: "Patient ID",
            accessorKey: "PatientID",
            cell: (p: Patient) => (
                <span className="font-mono text-indigo-400 font-bold">{p.PatientID}</span>
            )
        },
        {
            header: "Full Name",
            accessorKey: "Name",
            sortable: true
        },
        {
            header: "Age",
            accessorKey: "Age",
            sortable: true,
            cell: (p: Patient) => (
                <span className="text-muted-grey">{p.Age} yrs</span>
            )
        },
        {
            header: "Primary Condition",
            accessorKey: "Condition",
            cell: (p: Patient) => (
                <div className="flex flex-col">
                    <span className="font-medium">{p.Condition}</span>
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "Status",
            sortable: true,
            cell: (p: Patient) => {
                const colors = {
                    Active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    "Follow-up": "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    Critical: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                };
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[p.Status]}`}>
                        {p.Status}
                    </span>
                );
            }
        },
        {
            header: "Registered On",
            accessorKey: "CreatedAt",
            sortable: true,
            cell: (p: Patient) => (
                <span className="text-muted-grey text-xs">
                    {new Date(p.CreatedAt).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="py-6">
            <DataTable
                title="Registered Patients"
                description="Comprehensive list of all patients on-boarded through the BharatCare network."
                data={data}
                columns={columns}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />
        </div>
    );
}
