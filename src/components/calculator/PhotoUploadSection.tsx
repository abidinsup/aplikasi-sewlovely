"use client";

import * as React from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PhotoUploadSectionProps {
    onMotifCodeChange: (file: File | null) => void;
    onMotifChange: (file: File | null) => void;
    className?: string;
}

export function PhotoUploadSection({ onMotifCodeChange, onMotifChange, className }: PhotoUploadSectionProps) {
    const [motifCodePreview, setMotifCodePreview] = React.useState<string | null>(null);
    const [motifPreview, setMotifPreview] = React.useState<string | null>(null);

    const motifCodeInputRef = React.useRef<HTMLInputElement>(null);
    const motifInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'code' | 'motif') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        if (type === 'code') {
            setMotifCodePreview(previewUrl);
            onMotifCodeChange(file);
        } else {
            setMotifPreview(previewUrl);
            onMotifChange(file);
        }
    };

    const handleRemove = (type: 'code' | 'motif') => {
        if (type === 'code') {
            setMotifCodePreview(null);
            onMotifCodeChange(null);
            if (motifCodeInputRef.current) motifCodeInputRef.current.value = '';
        } else {
            setMotifPreview(null);
            onMotifChange(null);
            if (motifInputRef.current) motifInputRef.current.value = '';
        }
    };

    return (
        <section className={cn("bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4", className)}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                    <Camera className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-lg">Foto & Motif</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Motif Code Upload */}
                <div className="relative">
                    <input
                        type="file"
                        ref={motifCodeInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'code')}
                    />

                    {motifCodePreview ? (
                        <div className="h-32 rounded-3xl overflow-hidden relative group border-2 border-slate-100">
                            <Image
                                src={motifCodePreview}
                                alt="Kode Motif"
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => handleRemove('code')}
                                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => motifCodeInputRef.current?.click()}
                            className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all group"
                        >
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors border border-slate-100">
                                <Camera className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600 text-center px-2">Ambil Foto Kode Motif</span>
                        </button>
                    )}
                </div>

                {/* Motif Upload */}
                <div className="relative">
                    <input
                        type="file"
                        ref={motifInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'motif')}
                    />

                    {motifPreview ? (
                        <div className="h-32 rounded-3xl overflow-hidden relative group border-2 border-slate-100">
                            <Image
                                src={motifPreview}
                                alt="Motif"
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => handleRemove('motif')}
                                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => motifInputRef.current?.click()}
                            className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all group"
                        >
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors border border-slate-100">
                                <ImageIcon className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600 text-center px-2">Ambil Foto Motif</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
