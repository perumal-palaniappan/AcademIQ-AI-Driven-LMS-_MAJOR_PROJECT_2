# Run Commands for Major Project Demo

## Prerequisites
Make sure you have:
- PostgreSQL running on localhost:5432
- Database `major_project` created
- Node.js and npm installed

## Step 1: Start Backend Server

Open a terminal and run:

```powershell
cd "c:\Users\Perumal.p1\OneDrive - Avantor\Desktop\Major_Project_Demo\backend"
npm start
```

The backend server will start on **http://localhost:5000**

## Step 2: Start Frontend Server

Open a NEW terminal and run:

```powershell
cd "c:\Users\Perumal.p1\OneDrive - Avantor\Desktop\Major_Project_Demo\frontend"
npm run dev
```

The frontend will start on **http://localhost:5173**

## Latest Updates

### ✅ AI Notes Generator Integration
- **AI Integration**: Powered by **Cohere AI (Command A)** (Free, Robust, and Multilingual).
- **Filter Options**: Select from **Short** (Summaries), **Medium** (Balanced), or **Detailed** (In-depth) note types.
- **Search History**: Automatically saves all generated notes to the database with a quick history preview.
- **Export**: Built-in "Print to PDF" functionality for generated notes.

### ⚠️ IMPORTANT: AI Setup Required
To use the AI Note Generator, you must:
1. Get a free Trial API Key from [Cohere Dashboard](https://dashboard.cohere.com/).
2. Add it to your `backend/.env` file:
   ```env
   COHERE_API_KEY=your_actual_api_key_here
   ```

### ✅ Google OAuth Avatar Fix
...

### ✅ Settings Page Improvements
- **Quick Navigation** now works with smooth scroll-to-section functionality
- Click on any navigation item (Profile Details, Security, Appearance, About, Danger Zone) to scroll to that section
- Active section is highlighted in the navigation menu
- **Profile Card Simplified**: Removed "Pro Plan" badge and "Projects/Teams" statistics
- Profile card now shows only: Avatar, Name, and Role

### ✅ Dashboard Navigation
- All sidebar navigation items are properly linked
- Settings button navigates to Settings page
- Logo and brand name click returns to Dashboard

## Testing

1. Open **http://localhost:5173** in your browser
2. Test Google OAuth login and verify avatar appears in profile badge
3. Navigate to Settings page
4. Test Quick Navigation by clicking different sections
5. Verify profile card shows only Avatar, Name, and Role (no Pro Plan or stats)

## Debugging

If you encounter issues:

1. **Backend logs**: Check the terminal running the backend for OAuth and avatar URL logs
2. **Browser console**: Open DevTools (F12) to see frontend logs
3. **LocalStorage**: Check Application tab → Local Storage → http://localhost:5173 for stored user data
