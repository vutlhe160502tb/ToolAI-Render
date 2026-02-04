"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type Props = {
  question: string;
  answer: string;
};

export function FAQItem({ question, answer }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-purple-400 transition-colors"
      >
        <span className="text-lg font-bold">{question}</span>
        {isOpen ? (
          <Minus size={20} className="text-purple-500 shrink-0" />
        ) : (
          <Plus size={20} className="shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
          {answer}
        </div>
      )}
    </div>
  );
}
