"use client";

import React, { useState } from "react";
import { MyAssistant } from "@/components/MyAssistant";
import {
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Circle
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
      <MyAssistant />
    </div>
  );
}
