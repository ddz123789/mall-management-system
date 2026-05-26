import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || '服务器内部错误' });
}
