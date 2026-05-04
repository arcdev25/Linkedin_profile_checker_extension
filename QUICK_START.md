# Quick Start Guide - LinkedIn Profile Checker Dashboard

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Supabase (2 minutes)

1. **Copy environment template**
   ```bash
   copy .env.template .env
   ```

2. **Add your Supabase credentials to `.env`**
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Get these from: Supabase Dashboard → Settings → API

### Step 2: Database Setup (1 minute)

Your schema is already created! Just verify the tables exist:
- ✅ `recruiters`
- ✅ `profiles`
- ✅ `contacts`

### Step 3: Add Sample Data (Optional - 1 minute)

Run `sample_data.sql` in Supabase SQL Editor to populate test data.

### Step 4: Start the App (1 minute)

```bash
npm start
```

### Step 5: View Dashboard

Navigate to Dashboard page - you're done! 🎉

## What You'll See

### 📊 Dashboard Metrics
- Total Profiles tracked
- Pending contacts
- Active chats
- Success rate
- Failed attempts
- Not interested count

### 📈 Visual Analytics
- **Line Chart**: 7-day activity trends
- **Bar Chart**: Daily status breakdown
- **Doughnut Chart**: Status distribution
- **Table**: Recruiter performance

## Verify It's Working

✅ **All stat cards show numbers** (not zeros)  
✅ **Charts display with data**  
✅ **Recruiter table has rows**  
✅ **No console errors**

## If Something's Wrong

### Dashboard shows all zeros?
- Check `.env` file has correct Supabase credentials
- Restart dev server: `Ctrl+C` then `npm start`
- Verify tables have data in Supabase

### Charts not showing?
- Check browser console for errors
- Verify sample data was inserted
- Refresh the page (F5)

### "Cannot connect to Supabase"?
- Verify Supabase URL and key in `.env`
- Check Supabase project is active
- Verify RLS policies allow reading

## Next Actions

### Add Real Data
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Add recruiters, profiles, and contacts manually
4. Or use the Chrome extension to import LinkedIn profiles

### Customize Dashboard
- Edit `src/features/dashboard/index.js` for layout changes
- Modify chart colors in component files
- Add new metrics in `dashboardSlice.js`

## Need Help?

📖 **Detailed Guides:**
- `DASHBOARD_INTEGRATION_GUIDE.md` - Complete dashboard documentation
- `IMPLEMENTATION_SUMMARY.md` - Architecture overview
- `SUPABASE_SETUP.md` - Database details

## That's It!

Your dashboard is now connected to Supabase and displaying real-time recruitment analytics. Start tracking your LinkedIn outreach efforts! 🚀
