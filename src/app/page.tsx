"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from "next/image";
import { toPng } from 'html-to-image';

// Define interfaces for our data structures
interface SearchResult {
  id: number;
  title: string;
  artist: string;
  url: string;
  thumbnailUrl?: string; // Optional thumbnail
}

interface SelectedSong extends SearchResult { }

const MAX_SELECTED_LINES = 4;

// Define Font Options
const fontOptions = [
  { name: 'Geist Sans', value: 'var(--font-geist-sans)' },
  { name: 'Geist Mono', value: 'var(--font-geist-mono)' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto Mono', value: '"Roboto Mono", monospace' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
];

// Define Gradient Presets
const gradientPresets = [
  { name: 'Default', value: 'bg-gradient-to-br from-purple-600 to-indigo-600' },
  { name: 'Sunset', value: 'bg-gradient-to-br from-red-500 to-orange-500' },
  { name: 'Ocean', value: 'bg-gradient-to-br from-blue-400 to-emerald-400' },
  { name: 'Forest', value: 'bg-gradient-to-br from-green-500 to-lime-600' },
  { name: 'Twilight', value: 'bg-gradient-to-br from-indigo-500 to-purple-800' },
  { name: 'Mono', value: 'bg-gradient-to-br from-gray-700 to-gray-900' },
];

export default function Home() {
  const [coverKey, setCoverKey] = useState<number>(Date.now());
  const [coverLoaded, setCoverLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [selectedLineIndices, setSelectedLineIndices] = useState<number[]>([]); // Store indices
  const [isLoading, setIsLoading] = useState(false); // For search
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false); // For lyrics fetch
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState(fontOptions[1].value); // Default to Geist Mono
  const [selectedGradient, setSelectedGradient] = useState(gradientPresets[0].value); // Default gradient

  const lyricsLines = lyrics.split('\n');

  // Get content based on selected indices
  const getSelectedLineContent = useCallback((): string[] => {
    if (!lyrics || selectedLineIndices.length === 0) return [];
    // Ensure indices are sorted for correct order
    const sortedIndices = [...selectedLineIndices].sort((a, b) => a - b);
    return sortedIndices.map(index => lyricsLines[index] || '');
  }, [lyrics, selectedLineIndices, lyricsLines]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setSearchResults([]);
    setSelectedSong(null);
    setLyrics('');
    setSelectedLineIndices([]);  // <-- corregido aquí

    try {
      const response = await fetch(`/api/lyrics?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSearchResults(data.results || []);
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(`Failed to search for songs: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSong = async (song: SearchResult) => {
    console.log(`Selected song:`, song);
    setSelectedSong(song);
    setLyrics('');
    setSelectedLineIndices([]);  // <-- y aquí también
    setError('');
    setIsFetchingLyrics(true);
    setSearchResults([]); // Clear search results

    try {
      const response = await fetch(`/api/lyrics?songUrl=${encodeURIComponent(song.url)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `Failed to fetch lyrics (Status: ${response.status})`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setLyrics(data.lyrics || 'Lyrics not found.');
    } catch (err: any) {
      console.error("Lyrics fetch failed:", err);
      setError(err.message || 'Failed to fetch lyrics. Please try again.');
      setLyrics('');
      setSelectedSong(null);
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  const handleLineSelect = (index: number) => {
    setSelectedLineIndices(prevIndices => {
      if (prevIndices.length === 0) {
        return [index];
      }
      if (prevIndices.includes(index)) {
        if (prevIndices.length === 1 && prevIndices[0] === index) {
          return [];
        }
        return [];
      }
      const sorted = [...prevIndices].sort((a, b) => a - b);
      const min = sorted[0], max = sorted[sorted.length - 1];
      if ((index === min - 1 || index === max + 1) && prevIndices.length < MAX_SELECTED_LINES) {
        return [...prevIndices, index];
      }
      if (prevIndices.length >= MAX_SELECTED_LINES) {
        alert(`You can only select up to ${MAX_SELECTED_LINES} consecutive lines.`);
        return prevIndices;
      }
      return [index];
    });
  };

  const openPreviewModal = () => {
    if (selectedLineIndices.length === 0) {
      alert('Please select some lyrics lines first.');
      return;
    }
    const sorted = [...selectedLineIndices].sort((a, b) => a - b);
    const isConsecutive = sorted.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);
    if (!isConsecutive && sorted.length > 1) {
      alert('Please select consecutive lines.');
      return;
    }
    // Reset customizations when opening modal
    setCoverKey(Date.now());
    setCoverLoaded(false);
    setSelectedFont(fontOptions[1].value);
    setSelectedGradient(gradientPresets[0].value);
    setIsModalOpen(true);
    setIsModalOpen(true);
  };

  const closePreviewModal = () => {
    setIsModalOpen(false);
  };

  const exportPngFromModal = () => {
    const node = previewRef.current;
    if (!node) {
      console.error('Preview container not found');
      alert('Error preparing image. Could not find the preview element.');
      return;
    }
    toPng(node, ({
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: 'transparent',
      useCORS: true      // ← ensure cover is freshly fetched via CORS
    }) as any)
      .then((dataUrl: string) => {
        const link = document.createElement('a');
        const songTitle = selectedSong!.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${songTitle}_selection.png`;
        link.href = dataUrl;
        link.click();
        closePreviewModal();
      })
      .catch((err: any) => {
        console.error('PNG export failed:', err);
        alert('Failed to generate PNG. Please try again.');
      });
  };

  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold mb-8">Lyrics Finder</h1>

      {isLoading && <p className="text-blue-500 mb-4 text-center">Searching for songs...</p>}
      {isFetchingLyrics && <p className="text-blue-500 mb-4 text-center">Loading lyrics...</p>}

      <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
        <div className="flex items-center border-b border-teal-500 py-2">
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 dark:text-gray-300 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Search for a song..."
            aria-label="Song search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
          <button
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded disabled:opacity-50 transition-colors duration-200"
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading && !lyrics ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {/* Search Results */}
      {!isFetchingLyrics && searchResults.length > 0 && (
        <div className="w-full max-w-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Search Results</h2>
          <ul className="space-y-3">
            {searchResults.map((song) => (
              <li
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className="flex items-center p-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150"
              >
                {song.thumbnailUrl && (
                  <Image
                    src={song.thumbnailUrl}
                    alt={`${song.title} thumbnail`}
                    width={50}
                    height={50}
                    className="rounded mr-4 object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{song.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{song.artist}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lyrics Display */}
      {selectedSong && !isFetchingLyrics && lyrics && (
        <div className="w-full max-w-2xl mb-8 p-6 border rounded shadow-md bg-white dark:bg-gray-900">
          <div className="flex items-center mb-6 space-x-4 justify-center">
            {selectedSong.thumbnailUrl && (
              <Image
                src={selectedSong.thumbnailUrl}
                alt={`${selectedSong.title} cover`}
                width={64}
                height={64}
                className="rounded object-cover shadow-md"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold">{selectedSong.title}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{selectedSong.artist}</p>
            </div>
          </div>
          <div className="lyrics-container overflow-y-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm">
            {lyricsLines.map((line, index) => (
              <p
                key={index}
                onClick={() => handleLineSelect(index)}
                className={`whitespace-pre-wrap cursor-pointer p-1 rounded transition-colors duration-150 ${selectedLineIndices.includes(index)
                  ? 'bg-teal-200 dark:bg-teal-700 font-semibold'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {line.trim() === '' ? '\u00A0' : line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      {selectedLineIndices.length > 0 && selectedSong && !isFetchingLyrics && (
        <div className="text-center">
          <button
            onClick={openPreviewModal}
            className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Create Share Image ({selectedLineIndices.length}/{MAX_SELECTED_LINES})
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {isModalOpen && selectedSong && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full relative p-0 overflow-hidden">
            <button
              onClick={closePreviewModal}
              className="absolute top-2 right-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-3xl font-light leading-none z-10"
              aria-label="Close preview"
            >
              &times;
            </button>
            {/* Preview Content */}
            <div
              key={selectedSong.id}            // ← force React to remount on song change
              ref={previewRef}
              className={`p-6 text-white rounded-t-lg overflow-hidden ${selectedGradient}`}
              style={{ fontFamily: selectedFont, fontSize: '16px', lineHeight: '1.6' }} >
              {selectedSong.thumbnailUrl && (
                <img
                  src={`${selectedSong.thumbnailUrl}?_=${coverKey}`}
                  alt={`${selectedSong.title} cover`}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover float-right ml-4 mb-2 border-2 border-white/50 shadow-lg"
                  crossOrigin="anonymous"
                  onLoad={() => setCoverLoaded(true)}
                />
              )}
              <h3 className="text-lg font-bold mb-1 pb-1 border-b border-white/30">{selectedSong.title}</h3>
              <p className="text-sm mb-4 opacity-80">{selectedSong.artist}</p>
              <div className="clear-both pt-2">
                {getSelectedLineContent().map((line, i) => (
                  <p key={i} className="mb-1">{line || '\u00A0'}</p>
                ))}
              </div>
              <p className="mt-4 text-xs opacity-60 text-right clear-both">Lyrics via Genius</p>
            </div>

            {/* Customization Controls */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="font-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font:</label>
                <select
                  id="font-select"
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="gradient-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gradient:</label>
                <select
                  id="gradient-select"
                  value={selectedGradient}
                  onChange={(e) => setSelectedGradient(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {gradientPresets.map(preset => (
                    <option key={preset.name} value={preset.value}>{preset.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closePreviewModal}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={exportPngFromModal}
                disabled={!coverLoaded}
                className={`
    px-4 py-2 rounded text-white
    ${coverLoaded
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-400 cursor-not-allowed'}
    transition-colors duration-200
  `}
              >
                Export as PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
