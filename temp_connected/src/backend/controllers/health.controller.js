import { checkDbConnection } from '../db/client.js';

export async function getHealth(req, res, next) {
  try {
    const dbConnected = await checkDbConnection();

    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected/standby',
      service: 'ConnectEd Backend API',
    });
  } catch (err) {
    next(err);
  }
}
