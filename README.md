# DailyDrive

A modern car rental and sales platform built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (optional, for containerized setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dailydrive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

The app will be available at `http://localhost:5173`

### Using Makefile Commands

```bash
# Run the container
make start-dev

# Stop the container
make stop-dev

# View logs
make logs-dev

# Rebuild containers
make rebuild-dev
```

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🌍 Multi-language Support

The app supports 4 languages:
- 🇬🇧 English (en)
- 🇮🇹 Italian (it)
- 🇦🇱 Albanian (sq)
- 🇬🇷 Greek (el)

Language can be switched from the header navigation.

## 🏗️ Project Structure

```
dailydrive/
├── src/
│   ├── components/        # React components
│   │   ├── Analytics.tsx  # Analytics dashboard
│   │   ├── ReservationsCalendar.tsx  # Calendar view
│   │   ├── LandingPage.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── pages/            # Page components
│   ├── context/          # React context providers
│   ├── i18n/             # Translations
│   ├── models/           # TypeScript interfaces
│   ├── service/          # API services
│   └── App.tsx
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── Makefile             # Build automation
└── package.json
```

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.0
- **Styling**: CSS Modules
- **Calendar**: FullCalendar
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Internationalization**: Custom i18n implementation

## 🎨 Features

- **Landing Page**: Modern, responsive landing page with hero section
- **Car Listings**: Browse cars for rent or purchase with advanced filters
- **Reservations Calendar**: Full calendar view with booking management
- **Analytics Dashboard**: Real-time stats and booking insights
- **Multi-language**: Support for 4 languages
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Component architecture supports theming

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Add your environment variables here
VITE_API_URL=your_api_url
```

## 🚧 Development

### Adding New Features

1. Create components in `src/components/`
2. Add translations in `src/i18n/translations.ts`
3. Update routing in `src/App.tsx`
4. Add styles in corresponding `.css` files

### Code Style

- Use TypeScript for all new components
- Follow existing naming conventions
- Add translations for all user-facing text
- Keep components modular and reusable

