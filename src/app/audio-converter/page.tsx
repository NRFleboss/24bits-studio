"use client";
import React, { useRef, useState } from "react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type OutputFormat = 'wav' | 'mp3';

export default function AudioConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('wav');
  const [info, setInfo] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setInfo("");
      setIsError(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setInfo("");
      setIsError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setInfo("Select an audio file");
      setIsError(true);
      return;
    }
    setLoading(true);
    setInfo("");
    setIsError(false);

    try {
      const ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      const inputExt = file.name.split('.').pop() || 'input';
      const inputName = `input.${inputExt}`;
      const outputName = `output.${outputFormat}`;
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      if (outputFormat === 'wav') {
        await ffmpeg.exec([
          '-i', inputName,
          '-ar', '44100',
          '-acodec', 'pcm_s24le',
          outputName
        ]);
      } else {
        await ffmpeg.exec([
          '-i', inputName,
          '-ar', '44100',
          '-ab', '320k',
          '-acodec', 'libmp3lame',
          outputName
        ]);
      }
      
      const outBuffer = await ffmpeg.readFile(outputName);
      const mimeType = outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';
      const blob = new Blob([outBuffer], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      let outName = file.name.replace(/\.[^/.]+$/, "");
      outName += outputFormat === 'wav' ? " (24bit).wav" : " (320k).mp3";
      
      const a = document.createElement("a");
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setInfo(`Converted to ${outputFormat.toUpperCase()}`);
      setIsError(false);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      console.error('FFmpeg error:', err);
      setInfo("Conversion failed");
      setIsError(true);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Minimal header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-8">
        <a href="/" className="text-white text-lg font-light hover:text-gray-300 transition-colors">
          ← 24bits
        </a>
      </div>

      {/* Centered content */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Title */}
          <h1 className="text-4xl font-extralight text-white mb-16 text-center tracking-wide">
            Audio Converter
          </h1>

          {/* Format Toggle */}
          <div className="mb-12">
            <div className="flex border border-gray-800 rounded">
              <button
                type="button"
                onClick={() => setOutputFormat('wav')}
                className={`flex-1 py-4 px-6 text-sm transition-colors ${
                  outputFormat === 'wav'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                WAV 24bit
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat('mp3')}
                className={`flex-1 py-4 px-6 text-sm transition-colors ${
                  outputFormat === 'mp3'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MP3 320k
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed py-20 px-8 text-center transition-colors mb-12 ${
              dragActive
                ? 'border-white'
                : 'border-gray-800 hover:border-gray-700'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              ref={inputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
            
            {file ? (
              <div className="space-y-4">
                <p className="text-white text-lg">{file.name}</p>
                <p className="text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-400 text-lg">Drop your audio file here</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-white text-lg hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  or browse
                </button>
              </div>
            )}
          </div>

          {/* Convert Button */}
          {file && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-5 bg-white text-black text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-gray-100"
            >
              {loading ? "Converting..." : `Convert to ${outputFormat.toUpperCase()}`}
            </button>
          )}

          {/* Status */}
          {info && (
            <div className={`mt-6 text-center ${isError ? 'text-red-400' : 'text-gray-400'}`}>
              {info}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}