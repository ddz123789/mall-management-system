import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'mall-jwt-secret-key-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES || '24h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'mall-jwt-refresh-secret-key-2024',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
