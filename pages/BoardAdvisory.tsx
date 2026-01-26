



import React, { useState, useRef } from 'react';
import { Send, ShieldCheck, Terminal, Cpu, FileText, Activity, Lock, MessageSquare, Paperclip, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '../services/geminiService';
import { ChatRequestDto, ExpertType } from '../types';

export const BoardAdvisory: React.FC = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'agent', content: string}[]>([
        { role: 'agent', content: "**System Online.** Complia Financial Promotion Agent (CFPA) initialized.\n\nReady for Digital Board governance inquiries. All interactions are logged in Gem Memory." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expertType, setExpertType] = useState<ExpertType>(ExpertType.REGULATORY);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() && attachments.length === 0) return;
        
        const userMsg = { role: 'user' as const, content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const dto: ChatRequestDto = {
            threadId: `thread-${Date.now()}`,
            content: text,
            expertType: expertType,
            attachments: attachments
        };

        // Clear attachments after sending
        setAttachments([]);

        try {
            // Add initial empty agent message
            setMessages(prev => [...prev, { role: 'agent', content: '' }]);
            
            const stream = streamChat(dto);
            let fullResponse = "";

            for await (const chunk of stream) {
                fullResponse += (chunk || "");
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'agent') {
                        lastMsg.content = fullResponse;
                    }
                    return newMsgs;
                });
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'agent', content: "Error: Unable to access Regulatory Knowledge Base." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const starterPrompts = [
        { title: "Supervisory Readiness", prompt: "Generate a 'Readiness View' for an FCA supervisory visit regarding our recent ESG campaign." },
        { title: "Board Summary", prompt: "Provide a Board Summary for the Weekly Meeting highlighting new RED items." },
        { title: "Reg Interpretation", prompt: "Draft a Regulatory Interpretation Memo regarding the new 'Anti-Greenwashing' rule applicability." },
        { title: "Golden Source Prompt", prompt: "Convert to Prompt: Synthesize the recent findings into a Golden Source Prompt." }
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="bg-slate-900 text-white p-6 rounded-t-xl shadow-lg border-b border-slate-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                        <Terminal className="h-6 w-6" /> Digital Board: Governance & Protocol
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-mono">
                        SMF Oversight Channel • FCA COBS 4 / PRIN 2A • Gem Memory Active
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <select 
                        value={expertType}
                        onChange={(e) => setExpertType(e.target.value as ExpertType)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value={ExpertType.REGULATORY}>Regulatory (FCA)</option>
                        <option value={ExpertType.LEGAL}>Legal Counsel</option>
                        <option value={ExpertType.CODING}>RegTech Engineer</option>
                        <option value={ExpertType.GENERAL}>General</option>
                    </select>
                    <div className="px-3 py-1 bg-slate-800 rounded border border-slate-700 text-xs flex items-center gap-2">
                        <Cpu className="h-3 w-3 text-blue-400" /> Agent Active
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col border-x border-slate-200">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'agent' && (
                                <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center flex-shrink-0 mt-1">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-lg p-4 shadow-sm text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white border border-slate-200 text-slate-800'
                            }`}>
                                <ReactMarkdown 
                                    components={{
                                        strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                                        table: ({node, ...props}) => <table className="border-collapse border border-slate-300 my-2 w-full text-xs" {...props} />,
                                        th: ({node, ...props}) => <th className="border border-slate-300 px-2 py-1 bg-slate-100" {...props} />,
                                        td: ({node, ...props}) => <td className="border border-slate-300 px-2 py-1" {...props} />
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1].role === 'user' && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center flex-shrink-0 mt-1">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <span className="text-xs text-slate-500 font-mono">Analyzing Gem Memory & Regulatory Corpus...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 border-t border-slate-200 rounded-b-xl shadow-lg z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {starterPrompts.map((p, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSend(p.prompt)}
                            disabled={isLoading}
                            className="text-left p-3 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-xs group"
                        >
                            <div className="font-bold text-slate-700 group-hover:text-blue-700 mb-1 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> {p.title}
                            </div>
                            <div className="text-slate-500 line-clamp-2 leading-tight">
                                {p.prompt}
                            </div>
                        </button>
                    ))}
                </div>
                
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs text-slate-700 border border-slate-200">
                                <FileText className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-rose-500">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        multiple 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        title="Attach Files"
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                        className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium shadow-inner"
                        placeholder={`Ask the ${expertType} Advisor...`}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className="absolute inset-y-1 right-1 bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-md font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
