require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startScheduler } = require('./jobs/scheduler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 FlatSell Server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Start the daily booking-policy scheduler (Policy 1 auto-cancellation scan)
    startScheduler();
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
