# Week 2: Problem Discovery & Early Prototyping

## 🎯 Week 2 Objectives

**SDLC Focus**: Design & Development  
**Tools & Technologies**: HTML5, CSS, JS, Bootstrap/Tailwind, VSCode  
**Monetization Routes**: Ad revenue (Google AdSense) or donations

### Primary Goals
1. **Build wireframes & initial user interface**
2. **Start basic backend (APIs, databases)**
3. **Explore AI models for initial integration**
4. **Set up development environment**
5. **Create responsive design system**

## 📱 Wireframes & UI Design

### Mobile-First Wireframes

#### 1. Home Screen (Mobile 320px)
```
┌─────────────────────────┐
│  [☰] Smart Matatu  [🔍] │ ← Header
├─────────────────────────┤
│                         │
│    🚌 Welcome to        │ ← Hero Section
│    Smart Matatu         │
│    Find reliable routes │
│                         │
│  [Get Started] [Learn]  │ ← CTA Buttons
├─────────────────────────┤
│  📊 Live Stats          │ ← Quick Stats
│  • 15 routes active     │
│  • 234 reports today    │
│  • 4.2★ avg rating     │
├─────────────────────────┤
│  🗺️ Quick Actions       │ ← Action Cards
│  [View Map] [Report]    │
│  [Routes] [Safety]      │
└─────────────────────────┘
```

#### 2. Map View (Mobile 320px)
```
┌─────────────────────────┐
│  [←] Map View    [⚙️]   │ ← Header
├─────────────────────────┤
│                         │
│    🗺️ Interactive Map   │ ← Map Container
│    with Route Overlays  │
│                         │
│  [📍] [🔍] [📍] [⚙️]   │ ← Map Controls
├─────────────────────────┤
│  🚌 Route 42 (Thika)    │ ← Route Info
│  ⭐ 4.2 • 🕐 5min wait  │
│  [View Details]         │
├─────────────────────────┤
│  [Filter] [Sort] [List] │ ← View Options
└─────────────────────────┘
```

#### 3. Report Form (Mobile 320px)
```
┌─────────────────────────┐
│  [←] Report Trip  [❌]  │ ← Header
├─────────────────────────┤
│  📝 Trip Details        │ ← Form Section
│                         │
│  Route: [Select Route ▼]│
│  Fare:  [Enter Amount]  │
│  Wait:  [5 minutes]     │
│  Crowd: [●○○○]          │
│                         │
│  🚨 Safety Issues       │
│  [ ] Overcrowding       │
│  [ ] Reckless driving   │
│  [ ] Overcharging       │
│                         │
│  📍 Location: [Auto]    │
│  📷 Add Photo [📷]     │
├─────────────────────────┤
│  [Submit Report]        │ ← Submit Button
└─────────────────────────┘
```

#### 4. Login/Signup (Mobile 320px)
```
┌─────────────────────────┐
│  [←] Welcome Back       │ ← Header
├─────────────────────────┤
│                         │
│  📧 Email               │ ← Login Form
│  [Enter email]          │
│                         │
│  🔒 Password            │
│  [Enter password]       │
│                         │
│  [ ] Remember me        │
│  [Forgot password?]     │
│                         │
│  [Login]                │
├─────────────────────────┤
│  Don't have account?    │
│  [Sign Up]              │
└─────────────────────────┘
```

### Tablet Wireframes (768px)

#### 1. Home Screen (Tablet)
```
┌─────────────────────────────────────────────────────────┐
│  [☰] Smart Matatu  [🔍] [👤] [⚙️]                     │ ← Header
├─────────────────────────────────────────────────────────┤
│  🚌 Welcome to Smart Matatu                            │ ← Hero Section
│  Find reliable routes across Nairobi                   │
│  [Get Started] [Learn More] [View Demo]               │
├─────────────────────────────────────────────────────────┤
│  📊 Live Stats          🗺️ Quick Actions               │ ← Two Column
│  • 15 routes active     [View Map] [Report Trip]      │
│  • 234 reports today    [Route List] [Safety Alerts]  │
│  • 4.2★ avg rating     [Analytics] [Settings]        │
├─────────────────────────────────────────────────────────┤
│  🚌 Popular Routes                                     │ ← Route Cards
│  [Route 42] [Route 17] [Route 8] [Route 23]           │
└─────────────────────────────────────────────────────────┘
```

#### 2. Map View (Tablet)
```
┌─────────────────────────────────────────────────────────┐
│  [←] Map View    [🔍] [⚙️] [👤]                        │ ← Header
├─────────────────────────────────────────────────────────┤
│  🗺️ Interactive Map with Route Overlays                │ ← Map (Left)
│  [📍] [🔍] [📍] [⚙️] [Fullscreen]                     │
├─────────────────────────────────────────────────────────┤
│  🚌 Route 42 (Thika Road)    [Filter] [Sort] [List]   │ ← Route Info
│  ⭐ 4.2 • 🕐 5min wait • 💰 KES 50                    │
│  [View Details] [Report] [Save]                        │
└─────────────────────────────────────────────────────────┘
```

### Desktop Wireframes (1024px+)

#### 1. Dashboard (Desktop)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [☰] Smart Matatu  [🔍] [🗺️] [📊] [👤] [⚙️]                            │ ← Header
├─────────────────────────────────────────────────────────────────────────┤
│  🚌 Welcome to Smart Matatu                                            │ ← Hero Section
│  Find reliable routes across Nairobi                                   │
│  [Get Started] [Learn More] [View Demo] [Contact Us]                   │
├─────────────────────────────────────────────────────────────────────────┤
│  📊 Live Stats          🗺️ Quick Actions          🚌 Popular Routes    │ ← Three Column
│  • 15 routes active     [View Map] [Report Trip]  [Route 42] [Route 17]│
│  • 234 reports today    [Route List] [Safety]     [Route 8] [Route 23] │
│  • 4.2★ avg rating     [Analytics] [Settings]    [Route 15] [Route 31]│
├─────────────────────────────────────────────────────────────────────────┤
│  🗺️ Interactive Map with Route Overlays                                │ ← Full Width Map
│  [📍] [🔍] [📍] [⚙️] [Fullscreen] [Export] [Share]                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎨 Design System

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-900: #1e3a8a;
  
  /* Secondary Colors */
  --secondary-50: #f0fdf4;
  --secondary-100: #dcfce7;
  --secondary-500: #22c55e;
  --secondary-600: #16a34a;
  --secondary-700: #15803d;
  --secondary-900: #14532d;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Status Colors */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Typography Scale
```css
/* Mobile First */
.text-xs { font-size: 0.75rem; line-height: 1rem; }      /* 12px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* 14px */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* 16px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* 18px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* 20px */

/* Tablet */
@media (min-width: 768px) {
  .text-xl { font-size: 1.5rem; line-height: 2rem; }     /* 24px */
  .text-2xl { font-size: 1.875rem; line-height: 2.25rem; } /* 30px */
  .text-3xl { font-size: 2.25rem; line-height: 2.5rem; }   /* 36px */
}

/* Desktop */
@media (min-width: 1024px) {
  .text-2xl { font-size: 2.25rem; line-height: 2.5rem; }   /* 36px */
  .text-3xl { font-size: 3rem; line-height: 1; }           /* 48px */
  .text-4xl { font-size: 3.75rem; line-height: 1; }        /* 60px */
}
```

### Component Library

#### Buttons
```css
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply bg-primary-500 text-white hover:bg-primary-600;
}

.btn-secondary {
  @apply bg-secondary-500 text-white hover:bg-secondary-600;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50;
}

.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

.btn-lg {
  @apply px-6 py-3 text-lg;
}
```

#### Cards
```css
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.card-header {
  @apply px-6 py-4 border-b border-gray-200;
}

.card-body {
  @apply px-6 py-4;
}

.card-footer {
  @apply px-6 py-4 border-t border-gray-200;
}
```

#### Forms
```css
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-error {
  @apply text-sm text-red-600 mt-1;
}
```

## 🏗️ Development Environment Setup

### Frontend Setup
```bash
# Create React app with Vite
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install additional dependencies
npm install tailwindcss @tailwindcss/forms
npm install react-router-dom
npm install leaflet react-leaflet
npm install axios
npm install @types/leaflet

# Install development dependencies
npm install -D @types/react @types/react-dom
npm install -D eslint @typescript-eslint/eslint-plugin
npm install -D prettier
npm install -D @testing-library/react @testing-library/jest-dom
```

### Backend Setup
```bash
# Create Node.js backend
mkdir backend
cd backend
npm init -y

# Install dependencies
npm install express mongoose cors helmet morgan
npm install dotenv bcrypt jsonwebtoken
npm install express-rate-limit
npm install zod
npm install node-cron

# Install development dependencies
npm install -D @types/node @types/express
npm install -D @types/mongoose @types/cors
npm install -D @types/bcrypt @types/jsonwebtoken
npm install -D typescript ts-node nodemon
npm install -D jest @types/jest
```

### Database Setup
```bash
# MongoDB Atlas setup
# 1. Create cluster on MongoDB Atlas
# 2. Get connection string
# 3. Create .env file with:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-matatu
PORT=3001
JWT_SECRET=your-secret-key
```

## 🤖 AI Model Exploration

### Potential AI Integrations

#### 1. Route Optimization
- **Model**: Linear Regression for fare prediction
- **Data**: Historical fare data, time of day, route popularity
- **Implementation**: Python scikit-learn, TensorFlow.js
- **Use Case**: Predict optimal fares and route efficiency

#### 2. Safety Risk Assessment
- **Model**: Classification for safety scoring
- **Data**: Incident reports, weather, time patterns
- **Implementation**: Random Forest, Neural Networks
- **Use Case**: Real-time safety risk prediction

#### 3. Crowd Density Prediction
- **Model**: Time Series Forecasting
- **Data**: Historical crowding reports, events, holidays
- **Implementation**: LSTM, ARIMA
- **Use Case**: Predict peak times and crowding levels

#### 4. Natural Language Processing
- **Model**: Sentiment Analysis for reports
- **Data**: User text reports, comments
- **Implementation**: BERT, RoBERTa
- **Use Case**: Analyze user sentiment and extract insights

### AI Integration Strategy
```javascript
// Example AI service integration
class AIService {
  async predictFare(routeId, timeOfDay, dayOfWeek) {
    // Call AI model API
    const response = await fetch('/api/ai/predict-fare', {
      method: 'POST',
      body: JSON.stringify({ routeId, timeOfDay, dayOfWeek })
    });
    return response.json();
  }
  
  async assessSafety(routeId, weather, timeOfDay) {
    // Call safety assessment model
    const response = await fetch('/api/ai/assess-safety', {
      method: 'POST',
      body: JSON.stringify({ routeId, weather, timeOfDay })
    });
    return response.json();
  }
}
```

## 📱 Responsive Design Implementation

### Mobile-First CSS
```css
/* Base styles for mobile */
.container {
  width: 100%;
  max-width: 100%;
  padding: 0 1rem;
}

.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

/* Tablet styles */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Touch-Friendly Design
```css
/* Touch targets minimum 44px */
.btn, .form-input, .nav-link {
  min-height: 44px;
  min-width: 44px;
}

/* Touch feedback */
.btn:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}

/* Swipe gestures */
.swipe-container {
  touch-action: pan-x;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
```

## 🧪 Prototyping Tools

### Low-Fidelity Prototypes
- **Figma**: For wireframes and user flows
- **Balsamiq**: For quick mockups
- **Pen & Paper**: For initial ideation

### High-Fidelity Prototypes
- **Figma**: For detailed designs
- **Adobe XD**: For interactive prototypes
- **InVision**: For user testing

### Interactive Prototypes
- **HTML/CSS/JS**: For functional prototypes
- **React**: For component-based prototypes
- **CodePen**: For quick experiments

## 📊 Week 2 Deliverables

### Design Deliverables
- [ ] Mobile wireframes (4 screens)
- [ ] Tablet wireframes (2 screens)
- [ ] Desktop wireframes (2 screens)
- [ ] Design system documentation
- [ ] Component library
- [ ] User flow diagrams

### Development Deliverables
- [ ] Frontend development environment
- [ ] Backend development environment
- [ ] Database schema design
- [ ] Basic API endpoints
- [ ] Responsive CSS framework
- [ ] Component prototypes

### AI Exploration Deliverables
- [ ] AI model research
- [ ] Integration strategy
- [ ] Proof of concept
- [ ] API design for AI services
- [ ] Data requirements analysis

---

**Last Updated**: Week 2
**Next Review**: Week 3
**Status**: 🚧 In Progress
