import app from './app.js';
import { prisma } from './db/client.js';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 ConnectEd Backend Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Auth API:        http://localhost:${PORT}/api/auth`);
  console.log(`🎓 Students API:    http://localhost:${PORT}/api/students`);
  console.log(`💼 Alumni API:      http://localhost:${PORT}/api/alumni`);
  console.log(`🤝 Mentors API:     http://localhost:${PORT}/api/mentors`);
  console.log(`📌 Jobs API:        http://localhost:${PORT}/api/jobs`);
  console.log(`🧭 Career API:      http://localhost:${PORT}/api/career`);
  console.log(`====================================================`);
});

// Graceful Shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected successfully.');
    } catch (err) {
      console.error('Error during Prisma disconnect:', err);
    }
    process.exit(0);
  });

  // Force close after 5 seconds if still open
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
