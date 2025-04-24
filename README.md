# Lyrics Finder

A simple Next.js “client–side” web app that lets you search for song lyrics, select up to four consecutive lines, and export them as a shareable PNG image with customizable fonts and gradients.

## Features

- **Song Search**  
  Search Genius for song titles and artists directly from the input bar.

- **Lyrics Display**  
  Fetch and display full song lyrics in a scrollable container once a track is selected.

- **Line Selection**  
  Click to select up to 4 consecutive lines of lyrics for sharing.

- **Live Preview Modal**  
  Open a modal to see exactly how your selected lines will look—complete with album cover, title, artist name, and “Lyrics via Genius” attribution.

- **Customization Controls**  
  Choose from multiple fonts (e.g. Geist Sans, Geist Mono, Roboto Mono) and a variety of background gradients before exporting.

- **PNG Export**  
  Generate a high-resolution PNG of your custom lyric snippet, automatically downloading the file with a song-name-based filename.

## Setup & Usage

1. **Install dependencies**  

   ```bash
   npm install
   # or
   yarn install
