"use client";

import React from "react";
import { User, Stethoscope, CheckCircle2, HospitalIcon } from "lucide-react";
import { ToolCallMessagePartProps } from "@assistant-ui/react";

export const RegisterPatientCard: React.FC<ToolCallMessagePartProps<any, any>> = ({
    args,
    result,
}) => {
    if (!result) return (
        <div className="my-6 p-6 glass rounded-[32px] border border-white/5 animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <User className="text-muted-grey" size={24} />
            </div>
            <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-white/5 rounded" />
                <div className="h-3 w-48 bg-white/5 rounded" />
            </div>
        </div>
    );

    return (
        <div className="my-8 relative group">
            <div className="absolute -inset-1 bg-gemini-gradient opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500 rounded-[36px]" />
            <div className="relative p-6 glass rounded-[32px] border border-white/10 flex items-start gap-6 shadow-3xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="text-white text-lg font-bold tracking-tight">Patient Registered</h4>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <CheckCircle2 size={12} />
                            Success
                        </div>
                    </div>
                    <p className="text-[#919191] text-[15px] leading-relaxed mb-4">
                        Database updated successfully for <span className="text-white font-semibold">{args.name}</span>.
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono text-white/90">
                            PID: {result.patient_id}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CreateReferralCard: React.FC<ToolCallMessagePartProps<any, any>> = ({
    args,
    result,
}) => {
    if (!result) return (
        <div className="my-6 p-6 glass rounded-[32px] border border-white/5 animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <HospitalIcon className="text-muted-grey" size={24} />
            </div>
            <div className="h-4 w-48 bg-white/5 rounded" />
        </div>
    );

    return (
        <div className="my-8 relative group">
            <div className="absolute -inset-1 bg-gemini-gradient opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500 rounded-[36px]" />
            <div className="relative p-6 glass rounded-[32px] border border-white/10 flex items-start gap-6 shadow-3xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-white text-lg font-bold tracking-tight">Referral Issued</h4>
                        <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.15em] ${args.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            {args.priority} Priority
                        </div>
                    </div>
                    <p className="text-[#919191] text-[15px] leading-relaxed mb-5">
                        Patient referred to <span className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{args.specialist_type}</span> for further assessment.
                    </p>
                    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-muted-grey uppercase tracking-widest">Referral ID</span>
                            <span className="text-sm font-mono text-white/90">{result.referral_id}</span>
                        </div>
                        <CheckCircle2 size={24} className="text-emerald-500 opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    );
};
