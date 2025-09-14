# Maps Area Insights

A web application that enhances Google Maps by providing detailed area information and personalized recommendations for any point clicked on the map.

## Features

- **Rich Area Description**: Displays notable landmarks, restaurants, and places within a 3km radius
- **Personalized Suggestions**: Tailored recommendations based on user preferences
- **Peak Activity Times**: Best times to visit specific areas
- **User Preferences**: Customizable settings for interests, age group, and preferred activities

## Tech Stack

- **Frontend**: JavaScript, HTML, CSS, Google Maps JavaScript API
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **APIs**: Google Places API, Google Maps API
- **Authentication**: Firebase Authentication

## Project Structure

```
maps-area-insights/
├── backend/          # Node.js Express server
├── frontend/         # Frontend HTML/CSS/JS
├── .env.example      # Environment variables template
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Firebase account
- Google Cloud Platform account with Maps and Places API enabled

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from the example and fill in your API keys:
   ```bash
   cp ../.env.example .env
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Open `frontend/index.html` in a web browser
2. Make sure to replace the Google Maps API key in the HTML file

## Configuration

1. **Google Maps API**: Enable Maps JavaScript API and Places API in Google Cloud Console
2. **Firebase**: Create a Firebase project and enable Firestore
3. **Environment Variables**: Copy `.env.example` to `.env` and fill in your credentials

## Usage

1. Click anywhere on the map to get area insights
2. View personalized recommendations based on your preferences
3. Customize your preferences in the settings page
4. Explore detailed information about nearby places and optimal visit times
