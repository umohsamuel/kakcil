"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { CouncilDebate } from "./council-debate";

interface MessageListProps {
  messages: ChatMessage[];
  debatingMessageId: string | null;
}

export function MessageList({ messages, debatingMessageId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to AI Government Council
            </h2>
            <p className="text-gray-600 mb-4">
              Ask any question and our council of AI models will debate to find
              the best answer for you.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="ml-2">3 AI models ready</span>
            </div>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "user" ? (
              <div className="bg-indigo-600 text-white rounded-lg px-4 py-3 max-w-[70%] shadow-md">
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-indigo-200 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg px-4 py-3 max-w-[80%] shadow-md border border-gray-200">
                {message.isDebating ? (
                  <CouncilDebate />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        Council Response
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

