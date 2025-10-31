// Đây là tệp cấu hình.
// Điền các giá trị thực tế của bạn vào đây.
// Tệp này KHÔNG NÊN được commit vào git.

export const dbConfig = {
  host: process.env.DB_HOST || 'your_database_host',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER || 'your_db_username',
  password: process.env.DB_PASSWORD || 'your_super_secret_password',
  database: process.env.DB_NAME || 'ai_studio_db',
  ssl: process.env.DB_SSL === 'true', // Sử dụng true cho các kết nối production
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-and-long-jwt-secret-key',
  expiresIn: '1d', // Token hết hạn sau 1 ngày
};
