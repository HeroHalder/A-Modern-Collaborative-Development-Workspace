CREATE DATABASE IF NOT EXISTS hero_workspace
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hero_workspace;


-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    bio TEXT NULL,

    avatar VARCHAR(255) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================
-- PROJECTS
-- =========================================

CREATE TABLE projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT NULL,

    language VARCHAR(50) DEFAULT 'javascript',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================
-- PROJECT FILES
-- =========================================

CREATE TABLE project_files (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    project_id INT UNSIGNED NOT NULL,

    filename VARCHAR(255) NOT NULL,

    language VARCHAR(50) DEFAULT 'text',

    content LONGTEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_files_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);


-- =========================================
-- COLLABORATORS
-- =========================================

CREATE TABLE collaborators (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    project_id INT UNSIGNED NOT NULL,

    user_id INT UNSIGNED NOT NULL,

    role ENUM('owner', 'editor', 'viewer')
        DEFAULT 'viewer',

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_collaboration (
        project_id,
        user_id
    ),

    CONSTRAINT fk_collaborators_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_collaborators_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================
-- CODE EXECUTIONS
-- =========================================

CREATE TABLE executions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    project_id INT UNSIGNED NULL,

    language VARCHAR(50) NOT NULL,

    source_code LONGTEXT NOT NULL,

    output TEXT NULL,

    error TEXT NULL,

    execution_time DECIMAL(10,4) NULL,

    status ENUM(
        'queued',
        'running',
        'success',
        'failed',
        'timeout'
    ) DEFAULT 'queued',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_executions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_executions_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
);


-- =========================================
-- COLLABORATION MESSAGES
-- =========================================

CREATE TABLE messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    project_id INT UNSIGNED NOT NULL,

    user_id INT UNSIGNED NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_messages_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);