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

- **GET** `/api/telegram/{file_name}` - Get complete dataset
- **GET** `/api/telegram/{file_name}/seed` - Get seed data
- **GET** `/api/telegram/{file_name}/channel_id` - Get Telegram channel ID
- **GET** `/api/telegram/{file_name}/scores?start=0&size=10` - Get paginated scores

### X (Twitter) Endpoints

Base path: `/api/x`

- **GET** `/api/x/{file_name}` - Get complete dataset
- **GET** `/api/x/{file_name}/seed` - Get seed data
- **GET** `/api/x/{file_name}/community_id` - Get X community ID
- **GET** `/api/x/{file_name}/scores?start=0&size=10` - Get paginated scores

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
curl "https://api.openrank.com/api/telegram/decentraliseddotco/scores?start=0&size=20"
```

### Get X community ID
```bash
curl https://api.openrank.com/api/x/ritual-community/community_id
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
  "seed": [/* ScoreEntry array */],
  "scores": [/* ScoreEntry array */]
}
```

### GitHub Dataset
```json
{
  "category": "devrank",
  "ecosystem": "Crypto",
  "seed": [/* ScoreEntry array */],
  "scores": [/* ScoreEntry array */]
}
```

### Telegram Dataset
```json
{
  "category": "socialrank",
  "channel_id": "1533865579",
  "seed": [/* ScoreEntry array */],
  "scores": [/* ScoreEntry array */]
}
```

### X Dataset
```json
{
  "category": "xrank",
  "community_id": "1896991026272723220",
  "seed": [/* ScoreEntry array */],
  "scores": [/* ScoreEntry array */]
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
│   │   └── [...params].js          # Telegram endpoints
│   └── x/
│       └── [...params].js          # X endpoints
├── datasets/
│   ├── discord/
│   │   └── ritual.json
│   ├── github/
│   │   └── bitcoin.json
│   ├── telegram/
│   │   └── decentraliseddotco.json
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
