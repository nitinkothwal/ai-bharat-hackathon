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
        <div className="flex-1 flex flex-col overflow-hidden w-full relative bg-deep-obsidian">
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
          padding-bottom: 200px !important;
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
