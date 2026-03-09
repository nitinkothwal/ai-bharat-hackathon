"use client";

import React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@assistant-ui/react-ui";
import {
  makeAssistantToolUI,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { RegisterPatientCard, CreateReferralCard } from "./ToolCards";
import { SparklesIcon } from "lucide-react";

/**
 * High-fidelity Medical Assistant UI
 * Customizing assistant-ui's pre-built Thread to match the obsidian theme.
 */

export function MyAssistant() {
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const runtime = useAISDKRuntime(chat);

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full relative bg-deep-obsidian min-h-0">
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread
          tools={[
            makeAssistantToolUI({
              toolName: "register_patient",
              render: RegisterPatientCard,
            }),
            makeAssistantToolUI({
              toolName: "create_referral",
              render: CreateReferralCard,
            }),
          ]}
        />
      </AssistantRuntimeProvider>

      <style jsx global>{`
        /* Deep Obsidian Overrides */
        .aui-thread-root {
          background-color: transparent !important;
          color: #E3E3E3 !important;
          --aui-thread-bg: #0B0B0B !important;
          max-width: 100% !important;
          height: 100% !important;
          border: none !important;
        }

        .aui-thread-viewport {
          background-color: transparent !important;
          padding-top: 1rem !important;
          padding-bottom: 220px !important;
          overflow-y: auto !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }

        /* Custom Scrollbar for the chat */
        .aui-thread-viewport::-webkit-scrollbar {
          width: 8px !important;
          display: block !important;
        }

        .aui-thread-viewport::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03) !important;
        }

        .aui-thread-viewport::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 10px !important;
          border: 1px solid rgba(0, 0, 0, 0.2) !important;
          background-clip: padding-box !important;
        }

        .aui-thread-viewport::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35) !important;
          background-clip: padding-box !important;
        }

        /* Message Bubbles */
        .aui-user-message-root {
           background: transparent !important;
           border: none !important;
           padding: 2.5rem 1rem !important;
           align-items: flex-end !important;
        }
        
        .aui-user-message-content {
           color: #E3E3E3 !important;
           font-size: 1.1rem !important;
           text-align: right !important;
           max-width: 80% !important;
        }

        .aui-assistant-message-root {
           background: transparent !important;
           border: none !important;
           padding: 3rem 1rem !important;
        }
        
        .aui-assistant-message-content {
           color: #E3E3E3 !important;
           font-size: 1.1rem !important;
           line-height: 1.7 !important;
           opacity: 0.95 !important;
        }

        /* Floating Pill Composer (Spectacular Look) */
        .aui-composer-root {
           position: fixed !important;
           bottom: 3.5rem !important;
           left: 50% !important;
           transform: translateX(-50%) !important;
           width: 90% !important;
           max-width: 44rem !important;
           background: rgba(17, 17, 17, 0.75) !important;
           backdrop-filter: blur(16px) !important;
           -webkit-backdrop-filter: blur(16px) !important;
           border: 1px solid rgba(255, 255, 255, 0.08) !important;
           border-radius: 32px !important;
           padding: 0.6rem !important;
           box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.9) !important;
           z-index: 1000 !important;
           transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
           margin-bottom: 0 !important;
        }

        .aui-composer-root:focus-within {
           border-color: rgba(124, 58, 237, 0.3) !important;
           box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(124, 58, 237, 0.1) !important;
        }

        .aui-composer-input {
           background: transparent !important;
           color: #E3E3E3 !important;
           font-size: 1.05rem !important;
           min-height: 52px !important;
           padding: 0.75rem 1.25rem !important;
           border: none !important;
           box-shadow: none !important;
           outline: none !important;
        }

        .aui-composer-send {
           background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #C026D3 100%) !important;
           color: white !important;
           border-radius: 9999px !important;
           width: 44px !important;
           height: 44px !important;
           margin-left: 0.5rem !important;
           transition: all 0.3s ease !important;
        }

        .aui-composer-send:hover {
           opacity: 1 !important;
           transform: scale(1.05) !important;
           box-shadow: 0 0 20px rgba(124, 58, 237, 0.4) !important;
        }

        .aui-composer-attach {
          display: none !important;
        }

        /* Collapsible Thinking Tags */
        thinking {
          display: block !important;
          margin: 1.5rem 0 !important;
          padding: 1.25rem !important;
          padding-top: 2.5rem !important;
          background: rgba(17, 17, 17, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 12px !important;
          font-family: var(--font-mono) !important;
          font-size: 0.85rem !important;
          color: #919191 !important;
          line-height: 1.6 !important;
          max-height: 48px !important;
          overflow: hidden !important;
          position: relative !important;
          cursor: pointer !important;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          white-space: pre-wrap !important;
        }

        thinking:hover {
          max-height: 1000px !important;
          background: rgba(17, 17, 17, 0.8) !important;
          border-color: rgba(124, 58, 237, 0.2) !important;
          color: #E3E3E3 !important;
        }

        thinking::before {
          content: "THOUGHT PROCESS" !important;
          position: absolute !important;
          top: 0.75rem !important;
          left: 1.25rem !important;
          font-size: 0.65rem !important;
          font-weight: 900 !important;
          letter-spacing: 0.15em !important;
          color: #7C3AED !important;
          opacity: 0.8 !important;
        }

        thinking::after {
          content: "Click to expand" !important;
          position: absolute !important;
          top: 0.75rem !important;
          right: 1.25rem !important;
          font-size: 0.65rem !important;
          font-weight: bold !important;
          color: #919191 !important;
          opacity: 0.5 !important;
          transition: opacity 0.3s ease !important;
        }

        thinking:hover::after {
          content: "Expanded" !important;
          opacity: 0.2 !important;
        }

        .bg-gemini-gradient {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #C026D3 100%);
        }
        
        .gemini-glow {
          box-shadow: 0 0 25px rgba(124, 58, 237, 0.45);
        }
      `}</style>
    </div>
  );
}
