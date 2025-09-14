# Maps Area Insights

A comprehensive web application that enhances Google Maps by providing detailed area information and personalized recommendations for any point clicked on the map.

## 🌟 Features

- **Interactive Map Interface**: Click anywhere on Google Maps to get detailed insights
- **Rich Area Information**: Discover landmarks, restaurants, and notable places within 3km radius
- **Personalized Recommendations**: Tailored suggestions based on user preferences
- **Peak Times Analysis**: Get optimal visiting times for locations
- **User Preferences**: Customizable settings for interests, age group, and activities
- **Smart Caching**: Firebase-powered caching for improved performance

## 🛠️ Tech Stack

### Frontend
- **React** - Modern UI framework
- **Google Maps JavaScript API** - Interactive map functionality
- **CSS3** - Responsive styling
- **Firebase SDK** - Authentication and data storage

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Database and authentication
- **Google Places API** - Location data and recommendations
- **Cors** - Cross-origin resource sharing

### Database
- **Firebase Firestore** - User preferences and caching

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Maps API key
- Google Places API key
- Firebase project setup

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd maps-area-insights
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Add your API keys to .env file
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Add your API keys to .env file
   ```

### Configuration

#### Backend Environment Variables (.env)
```
PORT=3001
GOOGLE_PLACES_API_KEY=your_places_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

#### Frontend Environment Variables (.env)
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_FIREBASE_CONFIG=your_firebase_config_json
```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:3000`

## 📱 Usage

1. **Initial Setup**
   - Visit the Settings page to configure your preferences
   - Set your interests (food, nightlife, culture, history, etc.)
   - Choose your age group and activity preferences

2. **Exploring Areas**
   - Click anywhere on the map to get area insights
   - View recommended restaurants, landmarks, and activities
   - See peak times and optimal visiting hours
   - Get personalized recommendations based on your profile

3. **Managing Preferences**
   - Update your interests anytime via the Settings page
   - Toggle between different recommendation modes
   - Manage privacy settings

## 🏗️ Architecture

```
[Frontend: React + Google Maps API]
           ↓ (HTTP REST API)
[Backend: Node.js + Express]
           ↓
[Google Places API] ← [Personalization Engine] → [Firebase Firestore]
           ↓
[Cached Results + User Preferences]
```

### API Endpoints

#### POST `/api/area-insights`
Get personalized area insights for a specific location.

**Request Body:**
```json
{
  "coords": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "landmarks": [...],
  "restaurants": [...],
  "recommendations": [...],
  "peakTimes": {...},
  "bestVisitTime": "..."
}
```

#### GET/POST `/api/user/preferences`
Manage user preferences for personalization.

#### GET `/api/health`
Health check endpoint.

## 🔧 Development

### Project Structure

```
maps-area-insights/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

### Key Components

#### Frontend
- `MapContainer` - Main map interface
- `AreaInsights` - Results display overlay
- `SettingsPage` - User preferences interface
- `ApiService` - Backend communication

#### Backend
- `areaInsightsController` - Main insights endpoint
- `placesService` - Google Places API integration
- `personalizationService` - Recommendation engine
- `firebaseService` - Database operations

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, AWS, or Google Cloud Platform
- Ensure environment variables are properly configured
- Set up Firebase service account credentials

### Frontend (React)
- Deploy to Netlify, Vercel, or GitHub Pages
- Configure environment variables for production
- Ensure API endpoints point to production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Maps Platform for location services
- Firebase for backend infrastructure
- React community for frontend framework
- All contributors and testers

## 📞 Support

For support, email support@maps-area-insights.com or create an issue in the repository.

---

Made with ❤️ for better map exploration experiences
