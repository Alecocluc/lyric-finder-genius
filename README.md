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

2. **Run the app**  

   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open in browser**
    Navigate to `http://localhost:3000` in your web browser.
4. **Search for lyrics**
    Use the search bar to find a song by title or artist. Click on a result to load the lyrics.
5. **Select lines**
    Click on the lyrics to select up to four consecutive lines. The selected lines will be highlighted.
6. **Customize**
    Open the modal to preview your selected lines. Choose a font and gradient for the background.
7. **Export**
    Click the export button to download a PNG of your selected lines with the chosen customization.
8. **Share**
    Share the downloaded PNG on social media or with friends.
9. **Contribute**
    If you want to contribute, feel free to fork the repository and submit a pull request. Any feedback or suggestions are welcome!
10. **License**
    This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
11. **Acknowledgments**
    - [Genius API](https://docs.genius.com/) for song lyrics.
    - [Next.js](https://nextjs.org/) for the framework.
    - [React](https://reactjs.org/) for the UI components.
    - [Tailwind CSS](https://tailwindcss.com/) for styling.
    - [html2canvas](https://html2canvas.hertzen.com/) for exporting the PNG image.

## Disclaimer

This project is provided **for informational and educational purposes only**. It does **not** store or cache any lyrics or images; it simply fetches them from the Genius API for display and user interaction. All copyrights and image rights remain with their respective owners and license holders.

This application is **not** intended to violate or circumvent Genius’s Terms of Service or any applicable licensing agreements. By using or sharing lyric content obtained through this tool, you agree to comply with all relevant copyright and licensing requirements.
