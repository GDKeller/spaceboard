# Space APIs Reference Guide

> Comprehensive reference for real-time space data APIs, prioritized by official sources, community-maintained, and hobby projects.

## Table of Contents

1. [ISS Tracking APIs](#iss-tracking-apis)
2. [Astronaut Data APIs](#astronaut-data-apis)
3. [Satellite Tracking APIs](#satellite-tracking-apis)
4. [Space Launch APIs](#space-launch-apis)
5. [Space Weather APIs](#space-weather-apis)
6. [Planetary & Astronomy APIs](#planetary--astronomy-apis)
7. [Asteroid & NEO APIs](#asteroid--neo-apis)
8. [Additional NASA APIs](#additional-nasa-apis)

---

## ISS Tracking APIs

### 🏛️ Official Sources

#### NASA Trajectory Data
- **Type**: Data files (not REST API)
- **Description**: NASA provides ISS trajectory data in CCSDS standard format
- **Update Frequency**: ~3 times per week
- **Access**: Via NASA data archives
- **Note**: No direct REST API for ISS tracking from NASA

### 🌐 Community-Maintained

#### Open Notify API ⭐ (Currently Used)
- **Base URL**: `http://api.open-notify.org`
- **Authentication**: None required
- **Rate Limit**: None specified
- **Endpoints**:
  - `/iss-now.json` - Current ISS position
    - Response: `{timestamp, iss_position: {latitude, longitude}}`
  - `/astros.json` - Current people in space
    - Response: `{number, people: [{name, craft}]}`
  - `/iss-pass.json?lat=LAT&lon=LON` - ISS pass predictions
- **Notes**: Simple, reliable, free to use

#### Where the ISS at? API
- **Base URL**: `https://api.wheretheiss.at/v1`
- **Authentication**: None required
- **Rate Limit**: ~1 request/second
- **ISS NORAD ID**: 25544
- **Endpoints**:
  - `/satellites` - List tracked satellites
  - `/satellites/25544` - ISS current position
    - Response includes: latitude, longitude, altitude, velocity, visibility, footprint
  - `/satellites/25544/positions?timestamps=T1,T2...` - Historical positions (max 10)
  - `/satellites/25544/tles` - Two-Line Element data
  - `/coordinates/LAT,LON` - Timezone and location info
- **Features**: More comprehensive data than Open Notify

### 🛠️ Third-Party/Commercial

#### N2YO API
- **Base URL**: `https://api.n2yo.com/rest/v1/satellite`
- **Authentication**: API key required (free registration)
- **Rate Limit**: 1000 transactions/hour
- **ISS NORAD ID**: 25544
- **Endpoints**:
  - `/tle/{id}` - Two Line Elements
  - `/positions/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}` - Future positions
  - `/visualpasses/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{days}/{min_elevation}` - Visual passes
  - `/radiopasses/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{days}/{min_elevation}` - Radio passes
  - `/above/{observer_lat}/{observer_lng}/{observer_alt}/{radius}/{category}` - Satellites above location
- **Features**: Comprehensive tracking with predictions

---

## Astronaut Data APIs

### Open Notify API
- **Endpoint**: `/astros.json`
- **Description**: Current astronauts in space with their spacecraft
- **No authentication required**

### Launch Library 2 (The Space Devs)
- **Base URL**: `https://ll.thespacedevs.com/2.2.0`
- **Endpoints**: `/astronaut/` - Detailed astronaut profiles with images
- **Features**: Biographical data, mission history, profile images
- **Rate Limit**: 15 requests/hour (free tier)

---

## Satellite Tracking APIs

### Space-Track.org (Official U.S. Space Force)
- **Base URL**: `https://www.space-track.org`
- **Authentication**: Free registration required
- **Features**:
  - Complete satellite catalog (SATCAT)
  - TLE data with orbital elements
  - Tracks objects down to 10cm diameter
  - API Query Builder for complex queries
  - Includes classified "analyst objects" (80000-89999 range)
- **Rate Limit**: Throttled to maintain performance

### CelesTrak
- **Base URL**: `https://celestrak.org`
- **Authentication**: None
- **Features**:
  - TLE data in multiple formats (2LE, XML, JSON, CSV)
  - GP (General Perturbations) data
  - Free, long-standing service
- **Formats**: 2LE, CCSDS OMM (XML/KVN), JSON, CSV

### TLE API
- **Base URL**: `https://tle.ivanstanojevic.me`
- **Authentication**: None
- **Description**: Simple API for current NORAD TLE sets
- **Features**: Up-to-date TLE data for Earth-orbiting satellites

### Aviation Edge Satellite Tracker (Commercial)
- **Type**: Paid API
- **Features**:
  - Real-time position data
  - Filter by company, country, NORAD ID
  - Response time: ~0.3ms
- **Data**: Position, velocity, manufacturer, launch year, size

---

## Space Launch APIs

### SpaceX API (r-spacex)
- **Base URL**: `https://api.spacexdata.com/v5`
- **Authentication**: None
- **Rate Limit**: 50 requests/second per IP
- **Endpoints**:
  - `/launches/latest` - Latest launch data
  - `/launches` - All launches
  - `/rockets` - Rocket information
  - `/crew` - Crew missions
  - `/starlink` - Starlink satellites
  - `/launchpads` - Launch facilities
- **Features**: Comprehensive SpaceX mission data

### RocketLaunch.Live API
- **Base URL**: `https://fdo.rocketlaunch.live`
- **Free Tier**: Next 5 launches at `/json/launches/next/5`
- **Authentication**: API key for full access
- **Features**:
  - Manually curated launch database
  - Updated throughout the day
  - Pagination (25 results/page)

---

## Space Weather APIs

### NOAA Space Weather Prediction Center
- **Products**:
  - Aurora 30-minute forecast (OVATION model)
  - Real-Time Solar Wind (RTSW) data
  - Geomagnetic storm predictions
- **Data Source**: DSCOVR satellite at L1 point

### NASA DONKI (Space Weather Database)
- **Base URL**: Part of NASA API suite
- **Features**:
  - CME (Coronal Mass Ejection) data
  - Geomagnetic storm tracking
  - Solar flare events
  - API access to space weather notifications

### Australian Space Weather Service
- **Features**:
  - Aurora alerts for Australian region
  - Real-time space weather data
  - API access available

---

## Planetary & Astronomy APIs

### NASA APIs

#### Astronomy Picture of the Day (APOD)
- **Endpoint**: `https://api.nasa.gov/planetary/apod`
- **Description**: Daily astronomical image with explanation

#### Mars Rover Photos
- **Description**: Images from Curiosity, Opportunity, and Spirit rovers
- **Features**: Search by Sol (Martian day), Earth date, camera

#### InSight Mars Weather
- **Description**: Weather data from Mars surface
- **Data**: Temperature, wind, pressure per Sol

### Third-Party Astronomy APIs

#### Astronomy API
- **URL**: `https://astronomyapi.com`
- **Features**: Planetary positions, moon phases, astronomical calculations

#### TimeAndDate Astronomy API
- **Features**:
  - Sunrise/sunset times
  - Moon phases
  - Astronomical positions (altitude, azimuth, distance)
  - Tide information

---

## Asteroid & NEO APIs

### NASA NEO (Near Earth Object) APIs
- **Part of**: NASA API suite
- **Features**:
  - Track all known NEOs
  - Search by object ID
  - Approach dates and distances

### JPL Solar System Dynamics APIs
- **Base URL**: `https://ssd-api.jpl.nasa.gov`
- **Features**:
  - Solar System object data
  - Orbital elements
  - Close approach data

### CNEOS Sentry API
- **Description**: Asteroid impact monitoring
- **Features**: Machine-readable impact risk data

### American Meteor Society API
- **Type**: RESTful API
- **Authentication**: API key required
- **Features**:
  - Meteor event reports
  - Trajectory estimations
  - Fireball data

---

## Additional NASA APIs

### NASA Image and Video Library
- **Description**: 140,000+ NASA images and videos
- **Features**: Search, metadata, multiple resolutions

### TechPort
- **Description**: NASA technology project data
- **Features**: Technology portfolio, research projects

### Exoplanet Archive
- **Description**: Confirmed exoplanets and host stars
- **Features**: Detailed exoplanet parameters

### GeneLab
- **Description**: Space biology and omics data
- **Features**: Spaceflight experiment data

---

## Implementation Recommendations

### For SpaceBoard Project

1. **Primary ISS Tracking**: Continue using Open Notify API (simple, reliable, free)
2. **Enhanced Data**: Add Where the ISS at? API for velocity and altitude
3. **Astronaut Images**: Keep Launch Library 2 integration
4. **Future Features**:
   - Space weather alerts using NOAA/NASA DONKI
   - ISS pass predictions using N2YO
   - Launch tracking with SpaceX API
   - Aurora predictions for ISS location

### API Key Management

```javascript
// Recommended environment variables
OPEN_NOTIFY_API=http://api.open-notify.org  // No key needed
WHERE_ISS_API=https://api.wheretheiss.at/v1  // No key needed
NASA_API_KEY=your_nasa_api_key              // Get from api.nasa.gov
N2YO_API_KEY=your_n2yo_api_key             // Get from n2yo.com
LAUNCH_LIBRARY_KEY=your_ll2_key             // Get from thespacedevs.com
```

### Caching Strategy

- **ISS Position**: 1-5 second cache (moves fast)
- **Astronaut Data**: 6-hour cache (changes rarely)
- **Weather Data**: 15-minute cache
- **Launch Data**: 1-hour cache
- **TLE Data**: 12-hour cache

### Rate Limit Considerations

| API | Rate Limit | Strategy |
|-----|------------|----------|
| Open Notify | None | Use freely |
| Where ISS at | 1 req/sec | Implement throttling |
| NASA APIs | 1000/hour | Cache aggressively |
| N2YO | 1000/hour | Use sparingly |
| Launch Library | 15/hour (free) | Cache for 1 hour |

---

## Resources

- [NASA API Portal](https://api.nasa.gov)
- [Space-Track Registration](https://www.space-track.org/auth/createAccount)
- [N2YO API Registration](https://www.n2yo.com/api/)
- [CelesTrak TLE Data](https://celestrak.org/NORAD/elements/)
- [Open Notify Documentation](http://open-notify.org/Open-Notify-API/)

---

*Last Updated: January 2025*