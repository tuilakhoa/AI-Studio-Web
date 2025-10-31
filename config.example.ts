// Đây là một tệp cấu hình ví dụ.
// Sao chép tệp này thành 'config.ts' và điền các giá trị thực tế của bạn.
// KHÔNG BAO GIỜ commit tệp 'config.ts' chứa thông tin nhạy cảm vào git.

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER || 'your_db_user',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: process.env.DB_NAME || 'ai_studio_db',
  ssl: process.env.DB_SSL === 'true', // Sử dụng true cho các kết nối production như Neon, Vercel Postgres, etc.
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-and-long-jwt-secret-key',
  expiresIn: '1d', // Token hết hạn sau 1 ngày
};

// Cấu hình khác của ứng dụng có thể được thêm vào đây
// Ví dụ: Cấu hình cho dịch vụ gửi email, dịch vụ lưu trữ file, etc.
