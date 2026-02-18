"use client";

import { useState } from "react";

interface GenerateRequestBody {
  template: string;
  tone: string;
  notes: string;
}

interface GenerateSuccessResponse {
  english: string;
  chinese: string;
  bilingual: string;
  captions: string;
}

interface GenerateErrorResponse {
  error: string;
}

const templates = [
  "Preschool weekly update",
  "Elementary homeroom weekly update",
  "Subject teacher weekly update",
  "Activities and clubs weekly update",
  "Field trip and special event update",
  "Exam and assessment update",
] as const;

const tones = [
  "Warm and friendly",
  "Professional school voice",
  "Short and efficient",
] as const;

const tabs = ["Bilingual", "Chinese", "English", "Captions"] as const;

type Tab = (typeof tabs)[number];

const initialTabContent: Record<Tab, string> = {
  Bilingual: "",
  Chinese: "",
  English: "",
  Captions: "",
};

const emptyStateText = "No generated content yet. Paste notes and click Generate.";

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templates)[number]>(
    templates[0],
  );
  const [selectedTone, setSelectedTone] = useState<(typeof tones)[number]>(tones[0]);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Bilingual");
  const [tabContent, setTabContent] = useState<Record<Tab, string>>(initialTabContent);
  const [copiedTab, setCopiedTab] = useState<Tab | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      setGenerateError("Please add some notes before generating.");
      return;
    }

    setGenerateError(null);
    setIsGenerating(true);

    const payload: GenerateRequestBody = {
      template: selectedTemplate,
      tone: selectedTone,
      notes: trimmedNotes,
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => null)) as GenerateErrorResponse | null;
        throw new Error(errorBody?.error || "Failed to generate update.");
      }

      const data = (await response.json()) as GenerateSuccessResponse;
      setTabContent({
        Bilingual: data.bilingual,
        Chinese: data.chinese,
        English: data.english,
        Captions: data.captions,
      });
      setActiveTab("Bilingual");
    } catch (error) {
      if (error instanceof Error) {
        setGenerateError(error.message);
      } else {
        setGenerateError("Failed to generate update.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tabContent[activeTab]);
      setCopiedTab(activeTab);
      window.setTimeout(() => {
        setCopiedTab((currentTab) => (currentTab === activeTab ? null : currentTab));
      }, 1200);
    } catch {
      setCopiedTab(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          WeCom Weekly Update Composer
        </h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Template
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-500 transition focus:ring-2"
              value={selectedTemplate}
              onChange={(event) =>
                setSelectedTemplate(event.target.value as (typeof templates)[number])
              }
            >
              {templates.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Tone
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-500 transition focus:ring-2"
              value={selectedTone}
              onChange={(event) =>
                setSelectedTone(event.target.value as (typeof tones)[number])
              }
            >
              {tones.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-500 transition focus:ring-2"
            placeholder="Paste rough English notes here"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <p className="mt-2 text-right text-xs text-slate-500">{notes.length} characters</p>
        </div>

        <button
          type="button"
          className="mt-5 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
        {generateError ? (
          <p className="mt-2 text-sm text-red-600">{generateError}</p>
        ) : null}

        <section className="mt-8 rounded-xl border border-slate-200">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">{activeTab}</h2>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={handleCopy}
                disabled={!tabContent[activeTab]}
              >
                {copiedTab === activeTab ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="min-h-32 whitespace-pre-wrap rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {tabContent[activeTab] || (
                <span className="text-slate-500">{emptyStateText}</span>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
