# OpenRank API

A serverless REST API for serving OpenRank data from various platforms (Discord, GitHub, Telegram, and X/Twitter), deployed on Vercel.

## Features

- 🚀 Serverless architecture using Vercel
- 📊 Serves ranking data from multiple platforms
- 🔄 Pagination support for large datasets
- 🌐 CORS enabled for cross-origin requests
- 📁 Automatically loads JSON files from dataset directories

## Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- Vercel CLI (optional, for local testing)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run locally with Vercel Dev:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Deployment

### Deploy to Vercel

1. Install Vercel CLI (if not already installed):

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## API Endpoints

The API provides endpoints for four different platforms: Discord, GitHub, Telegram, and X (Twitter).

### Summaries

Base path: `/api/summaries`

- **GET** `/` - Get summaries

### Discord Endpoints

Base path: `/api/discord`

- **GET** `/api/discord/{file_name}` - Get complete dataset
- **GET** `/api/discord/{file_name}/seed` - Get seed data
- **GET** `/api/discord/{file_name}/server_id` - Get Discord server ID
- **GET** `/api/discord/{file_name}/scores?start=0&size=10` - Get paginated scores

### GitHub Endpoints

Base path: `/api/github`

- **GET** `/api/github/{file_name}` - Get complete dataset
- **GET** `/api/github/{file_name}/seed` - Get seed data
- **GET** `/api/github/{file_name}/ecosystem` - Get ecosystem name
- **GET** `/api/github/{file_name}/scores?start=0&size=10` - Get paginated scores

### Telegram Endpoints

Base path: `/api/telegram`

- **GET** `/api/telegram/{channel_id}` - Get complete dataset
- **GET** `/api/telegram/{channel_id}/seed` - Get seed data
- **GET** `/api/telegram/{channel_id}/scores?start=0&size=10` - Get paginated scores
- **GET** `/telegram/pfps/{user_id}.jpg` - Get user profile picture

**Note:** The `{channel_id}` parameter must be a numeric Telegram channel ID (e.g., `1533865579`). You can obtain channel IDs from the `/telegram` list endpoint.

### X (Twitter) Endpoints

Base path: `/api/x`

- **GET** `/api/x/{community_id}` - Get complete dataset
- **GET** `/api/x/{community_id}/seed` - Get seed data
- **GET** `/api/x/{community_id}/scores?start=0&size=10` - Get paginated scores

**Note:** The `{community_id}` parameter must be a numeric X community ID (e.g., `1872222575180546208`). You can obtain community IDs from the `/communities` endpoint.

## Query Parameters

### Pagination (for `/scores` endpoints)

- `start` (optional, default: 0) - Starting index for pagination
- `size` (optional, default: all) - Number of items to return

**Example:**

```bash
curl "https://api.openrank.com/api/discord/ritual/scores?start=10&size=5"
```

## Example Usage

### Get complete Discord dataset

```bash
curl https://api.openrank.com/api/discord/ritual
```

### Get GitHub seed data

```bash
curl https://api.openrank.com/api/github/bitcoin/seed
```

### Get paginated scores from Telegram

```bash
curl "https://api.openrank.com/api/telegram/1533865579/scores?start=0&size=20"
```

### Get Telegram user profile picture

```bash
curl https://api.openrank.com/telegram/pfps/1002217307.jpg --output profile.jpg
```

### Get X community data

```bash
curl https://api.openrank.com/api/x/1872222575180546208
```

## Data Structure

All datasets follow a similar structure:

### Score Entry

```json
{
  "i": "identifier",
  "v": 123.45
}
```

### Discord Dataset

```json
{
  "category": "socialrank",
  "server_id": "1210468736205852672",
  "seed": [
    /* ScoreEntry array */
  ],
  "scores": [
    /* ScoreEntry array */
  ]
}
```

### GitHub Dataset

```json
{
  "category": "devrank",
  "ecosystem": "Crypto",
  "seed": [
    /* ScoreEntry array */
  ],
  "scores": [
    /* ScoreEntry array */
  ]
}
```

### Telegram Dataset

```json
{
  "category": "socialrank",
  "channel_id": "1533865579",
  "seed": [
    /* ScoreEntry array */
  ],
  "scores": [
    /* ScoreEntry array */
  ]
}
```

### X Dataset

```json
{
  "category": "xrank",
  "community_id": "1896991026272723220",
  "seed": [
    /* ScoreEntry array */
  ],
  "scores": [
    /* ScoreEntry array */
  ]
}
```

## Project Structure

```
openrank-api/
├── api/
│   ├── _utils.js                    # Shared utilities
│   ├── discord/
│   │   └── [...params].js          # Discord endpoints
│   ├── github/
│   │   └── [...params].js          # GitHub endpoints
│   ├── telegram/
│   │   ├── [...params].js          # Telegram endpoints
│   │   └── pfps/
│   │       └── [id].js             # Profile pictures endpoint
│   └── x/
│       └── [...params].js          # X endpoints
├── datasets/
│   ├── discord/
│   │   └── ritual.json
│   ├── github/
│   │   └── bitcoin.json
│   ├── telegram/
│   │   ├── decentraliseddotco.json
│   │   └── pfps/
│   │       └── {user_id}.jpg       # Profile pictures
│   └── x/
│       └── ritual-community.json
├── package.json
├── vercel.json
└── README.md
```

## Adding New Datasets

To add new datasets, simply place JSON files in the appropriate directory under `datasets/`:

- `datasets/discord/` for Discord data
- `datasets/github/` for GitHub data
- `datasets/telegram/` for Telegram data
- `datasets/x/` for X/Twitter data

The filename (without `.json` extension) becomes the `{file_name}` parameter in the API endpoints.

Example: `datasets/discord/new-server.json` will be accessible at `/api/discord/new-server`

## Local Development

### Using Vercel Dev

```bash
npm run dev
```

This will start a local development server that mimics the Vercel serverless environment.

## Technology Stack

- **Vercel** - Serverless deployment platform
- **Node.js** - Runtime environment
- **Vercel Serverless Functions** - API endpoints

## Environment Variables

No environment variables are required for basic operation. All data is loaded from the `datasets/` directory.

## License

[Add your license here]
