# Anime Stream Finder

A TypeScript project for finding anime streams using web crawling and browser automation.

## Features

- REST API server (Express.js)
- Asynchronous request processing
- Browser automation (Playwright)
- HTML parsing (Cheerio)
- Request queue and retry mechanisms
- Graceful shutdown handling

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Copy `.env_example` to `.env` and configure environment variables

## Usage

### Start the server
```bash
npm start
```

### API Endpoints

- `POST /process` - Submit an anime search request
  - Request body: Anime object
  - Response: Task ID

- `GET /process/:taskId` - Check task status and get results
  - Response: Task status and results (when complete)

### Example Request
```json
{
  "title": "Attack on Titan",
  "episode": 1,
  "quality": "1080p"
}
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 9999)
- Other crawler-specific configurations can be added to `.env`

## Project Structure

```
src/
├── index.ts            # Main server entry point
├── interfaces/         # Type definitions
│   └── anime.ts
├── services/           # Business logic
│   └── stream.ts
├── sources/            # Data sources
│   └── animepahe.ts
└── utils/              # Utility functions
    ├── crawler.ts      # Crawling implementation
    └── similarity.ts   # Similarity matching
```

## Dependencies

- Express.js - Web server
- Crawlee - Web scraping framework
- Playwright - Browser automation
- Axios - HTTP client
- UUID - Unique ID generation

## License

ISC
