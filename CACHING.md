# SpaceBoard Caching Implementation

## Overview

SpaceBoard implements a robust browser-based caching system to minimize API calls and improve performance. The cache stores enriched astronaut data in localStorage for 24 hours.

## Features

- **Browser-based Storage**: Uses localStorage for persistent caching across page reloads
- **Automatic Expiration**: 24-hour TTL (Time To Live) for astronaut data
- **Stale-While-Revalidate**: Returns stale data if API is unavailable
- **Size Management**: Automatic cleanup when approaching localStorage limits
- **Console Utilities**: Built-in debugging tools

## How It Works

1. **First Load**: 
   - Fetches astronaut data from Open Notify API
   - Enriches with Launch Library API data (images, bios)
   - Stores combined data in localStorage

2. **Subsequent Loads**:
   - Checks localStorage cache first
   - Returns cached data if valid (< 24 hours old)
   - Only fetches from API if cache expired or missing

3. **Error Handling**:
   - Falls back to stale cache if API fails
   - Uses fallback images for rate-limited requests
   - Gracefully handles storage quota errors

## Console Commands

Open the browser console to use these utilities:

```javascript
// Show cache status
cacheStatus()

// Clear all cache
astronautCache.clear()

// Force refresh (from UI)
// Click the refresh button in the app
```

## Cache Structure

```javascript
{
  key: "spaceboard_astronauts_astronaut-data-enriched",
  data: {
    numberOfPeople: 12,
    expedition: {...},
    astronauts: [
      {
        name: "Tracy Caldwell Dyson",
        profileImageLink: "https://...",
        bio: "...",
        flightsCount: 3,
        // ... enriched data
      }
    ]
  },
  timestamp: 1719974400000,
  ttl: 86400000 // 24 hours
}
```

## Benefits

- **Reduced API Calls**: From ~24 API calls per load to 0-2
- **Faster Load Times**: Instant data from cache
- **Offline Support**: Works without internet (with cached data)
- **Rate Limit Protection**: Avoids Launch Library API throttling

## Technical Details

- **Storage**: localStorage (5MB limit per domain)
- **Serialization**: JSON stringify/parse
- **Key Format**: `spaceboard_astronauts_[cache-key]`
- **Cleanup**: Removes oldest 25% when approaching limit