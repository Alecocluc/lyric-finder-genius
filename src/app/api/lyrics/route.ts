import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// WARNING: Scraping websites like Genius can be unreliable and may violate their Terms of Service.
// Website structure changes can break this scraper without notice.
// Consider using official APIs if available for a more robust solution.

export async function GET(request: NextRequest) {
  console.log(`--- NEW REQUEST ---`);
  console.log(`Request URL: ${request.url}`); // Log the full URL
  const searchParams = request.nextUrl.searchParams;
  // Log the raw search params string for detailed debugging
  console.log(`Raw searchParams string: ${searchParams.toString()}`);

  const query = searchParams.get('query');
  const songUrl = searchParams.get('songUrl');

  // Log parsed parameters
  console.log(`API parsed params - query: ${query}, songUrl: ${songUrl}`);

  try {
    if (songUrl) {
      // Fetch Lyrics for a specific song URL
      try {
        console.log(`Attempting to fetch lyrics from: ${songUrl}`);
        const { data: songPageHtml, status: geniusStatus } = await axios.get(songUrl, {
          headers: {
            // Mimic browser headers to reduce chance of being blocked
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          }
        });
        console.log(`Successfully fetched from Genius with status: ${geniusStatus}`);

        const $song = cheerio.load(songPageHtml);

        // Genius uses divs with data-lyrics-container attribute
        let lyrics = '';
        $song('div[data-lyrics-container="true"]').each((_i, el) => {
          // Replace <br> tags with newlines and trim whitespace
          const htmlContent = $song(el).html()?.replace(/<br\s*\/?>/gi, '\n') ?? '';
          const $temp = cheerio.load(`<div>${htmlContent}</div>`); // Load into temp cheerio to get text
          lyrics += $temp.text().trim() + '\n\n'; // Add double newline for stanza breaks
        });

        lyrics = lyrics.replace(/\n{3,}/g, '\n\n').trim(); // Clean up extra newlines

        // Additional cleaning to remove common Genius metadata/artifacts
        // Remove lines like "X ContributorsTranslationsEnglish..."
        lyrics = lyrics.replace(/^\d+\s*ContributorsTranslations.*$/gm, '');
        // Remove bracketed annotations like [Verse 1], [Chorus], [Letra de...]
        lyrics = lyrics.replace(/^\[.*\]$/gm, '');
        // Remove potential duplicate titles or headers often included at the start
        // This is a bit heuristic - might need adjustment based on more examples
        const lines = lyrics.split('\n');
        if (lines.length > 2 && lines[0].toLowerCase().includes(lines[1].toLowerCase().substring(0, 10))) { // Check if line 1 contains part of line 2
            lines.shift(); // Remove the first line if it looks like a repeated header
        }
        lyrics = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(); // Re-join and clean newlines again


        if (!lyrics) {
           // Fallback for potential structure changes - try a common class (less reliable)
           console.warn(`Could not find lyrics using data-lyrics-container for ${songUrl}, trying fallback selector.`);
           // Attempt fallback selector and clean it too
           let fallbackLyrics = $song('.lyrics, .SongPage__LyricsText-sc-19xhmoi-0').text().trim();
           if (fallbackLyrics) {
               fallbackLyrics = fallbackLyrics.replace(/^\d+\s*ContributorsTranslations.*$/gm, '');
               fallbackLyrics = fallbackLyrics.replace(/^\[.*\]$/gm, '');
               const fallbackLines = fallbackLyrics.split('\n');
               if (fallbackLines.length > 2 && fallbackLines[0].toLowerCase().includes(fallbackLines[1].toLowerCase().substring(0, 10))) {
                   fallbackLines.shift();
               }
               lyrics = fallbackLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
           }
        }

        if (!lyrics) {
          console.error(`Failed to extract lyrics from ${songUrl} after attempting selectors.`);
          // Even if the page loaded, we couldn't find lyrics content
          return NextResponse.json({ error: 'Could not extract lyrics content from the Genius page.' }, { status: 500 });
        }

        return NextResponse.json({ lyrics });

      } catch (songFetchError: any) { // Catch errors specifically from fetching the song URL
        console.error(`Error fetching lyrics page from ${songUrl}:`, songFetchError.message);
        if (axios.isAxiosError(songFetchError)) {
          console.error('Axios error details (fetching song URL):', songFetchError.response?.status, songFetchError.response?.data);
          // Return a more specific error message indicating the failure came from Genius
          const status = songFetchError.response?.status || 'Unknown';
          return NextResponse.json({ error: `Failed to fetch lyrics page from Genius (Status: ${status})` }, { status: 502 }); // 502 Bad Gateway
        }
        // Fallback for non-Axios errors during song fetch
        return NextResponse.json({ error: 'An unexpected error occurred while fetching the lyrics page.' }, { status: 500 });
      }
    } else if (query) {
      // Search for songs based on the query
      const searchUrl = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(query)}`;
      console.log(`Searching Genius API: ${searchUrl}`);
      const { data: searchData } = await axios.get(searchUrl, {
        headers: {
          'Accept': 'application/json',
          // Genius might require more headers for consistent results, e.g., User-Agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const hits = searchData?.response?.sections?.find((section: any) => section.type === 'song')?.hits ?? [];

      const results = hits.map((hit: any) => ({
        id: hit.result.id,
        title: hit.result.title,
        artist: hit.result.primary_artist.name,
        url: hit.result.url,
        thumbnailUrl: hit.result.song_art_image_thumbnail_url,
      }));

      return NextResponse.json({ results });
    } else {
      // Neither songUrl nor query provided
      return NextResponse.json({ error: 'Either songUrl or query parameter is required' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in API route:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.status, error.response?.data);
      return NextResponse.json({ error: `Failed to fetch data from Genius: ${error.message}` }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}