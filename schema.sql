-- schema.sql
-- Lược đồ này thiết lập cơ sở dữ liệu cho AI Studio,
-- bao gồm người dùng, lịch sử sáng tạo, phiên trò chuyện, cờ tính năng và cài đặt SEO.

-- Bảng để lưu trữ thông tin người dùng
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    -- Vai trò người dùng: 0 cho người dùng thường, 1 cho quản trị viên
    role SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng để lưu trữ các tác phẩm đã tạo của người dùng
CREATE TABLE history_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    -- 'headshot', 'scene', 'video', v.v.
    type VARCHAR(50) NOT NULL,
    prompt TEXT,
    details VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE
);

-- Bảng để lưu trữ các phiên trò chuyện của chatbot
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng để lưu trữ các tin nhắn trong mỗi phiên trò chuyện
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    -- 'user' hoặc 'model'
    role VARCHAR(10) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng cho Cờ Tính năng của Admin
CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng cho Cài đặt SEO của Admin
CREATE TABLE seo_settings (
    id SERIAL PRIMARY KEY,
    page_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Tạo chỉ mục để cải thiện hiệu suất truy vấn
CREATE INDEX idx_history_items_user_id ON history_items(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Tùy chọn: Chèn một người dùng quản trị mặc định để kiểm thử
-- INSERT INTO users (email, password_hash, role) VALUES ('admin@aistudio.dev', 'a_very_strong_hashed_password', 1);

-- Tùy chọn: Chèn các cờ tính năng ban đầu
-- INSERT INTO feature_flags (feature_key, name, description, is_enabled) VALUES
-- ('video_composer', 'Trình tạo Video', 'Cho phép người dùng tạo video từ ảnh và lời nhắc.', TRUE),
-- ('outfit_try_on', 'Thử đồ AI', 'Tính năng thử trang phục ảo.', TRUE),
-- ('pose_transfer', 'Chuyển đổi Dáng', 'Sao chép dáng từ ảnh này sang ảnh khác.', TRUE),
-- ('texture_generator', 'Tạo Texture 3D', 'Tính năng đang thử nghiệm, tạo texture maps cho mô hình 3D.', FALSE);
