"use client";
import React, { useRef, useState } from "react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type OutputFormat = 'wav' | 'mp3';

export default function AudioConverterWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('wav');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
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
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
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
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setInfo(`Converted to ${outputFormat.toUpperCase()}`);
      setIsError(false);
    } catch (err) {
      console.error('FFmpeg error:', err);
      setInfo("Conversion failed");
      setIsError(true);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      {/* Title */}
      <h2 className="text-lg font-light text-white mb-8 text-center">
        Convert
      </h2>

      {/* Format Toggle */}
      <div className="mb-8">
        <div className="flex border border-gray-800 rounded">
          <button
            type="button"
            onClick={() => setOutputFormat('wav')}
            className={`flex-1 py-3 px-4 text-sm transition-colors ${
              outputFormat === 'wav'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            WAV
          </button>
          <button
            type="button"
            onClick={() => setOutputFormat('mp3')}
            className={`flex-1 py-3 px-4 text-sm transition-colors ${
              outputFormat === 'mp3'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            MP3
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed py-12 px-8 text-center transition-colors mb-8 ${
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
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
        
        {file ? (
          <div className="space-y-3">
            <p className="text-white text-sm">{file.name}</p>
            <p className="text-gray-500 text-xs">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-gray-400 hover:text-white text-xs transition-colors"
              disabled={loading}
            >
              Change file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Drop audio file</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-white text-sm hover:text-gray-300 transition-colors"
              disabled={loading}
            >
              Browse
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
          className="w-full py-4 bg-white text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-gray-100"
        >
          {loading ? "Converting..." : "Convert"}
        </button>
      )}

      {/* Status */}
      {info && (
        <div className={`mt-4 text-center text-xs ${isError ? 'text-red-400' : 'text-gray-400'}`}>
          {info}
        </div>
      )}

      {/* Audio Preview */}
      {audioUrl && !loading && (
        <div className="mt-8 pt-8 border-t border-gray-900">
          <audio 
            src={audioUrl} 
            controls 
            className="w-full opacity-60 hover:opacity-100 transition-opacity" 
          />
        </div>
      )}
    </div>
  );
}
