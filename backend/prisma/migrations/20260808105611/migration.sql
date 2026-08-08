-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_name` VARCHAR(20) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `streak_count` INTEGER NOT NULL DEFAULT 0,
    `rate` INTEGER NOT NULL DEFAULT 1000,
    `moral_score` INTEGER NOT NULL DEFAULT 1000,
    `delete_marker` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_user_name_delete_marker_key`(`user_name`, `delete_marker`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_session` (
    `session_id_hash` CHAR(64) NOT NULL,
    `users_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`session_id_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `battle_history` (
    `id` CHAR(36) NOT NULL,
    `users_id` INTEGER NOT NULL,
    `winner_flag` BOOLEAN NOT NULL,
    `matched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`, `users_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_updown_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `battle_history_id` CHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `rate_updown` INTEGER NOT NULL,

    UNIQUE INDEX `rate_updown_history_battle_history_id_user_id_key`(`battle_history_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moral_updown_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `battle_history_id` CHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `moral_score_updown` INTEGER NOT NULL,

    UNIQUE INDEX `moral_updown_history_battle_history_id_user_id_key`(`battle_history_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moral_violation_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `battle_history_id` CHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `moral_violation_category_id` INTEGER NOT NULL,
    `moral_violation_reason` VARCHAR(200) NOT NULL,

    UNIQUE INDEX `moral_violation_history_battle_history_id_user_id_key`(`battle_history_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moral_violation_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `moral_violation_category_category_key`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `login_session` ADD CONSTRAINT `login_session_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_history` ADD CONSTRAINT `battle_history_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rate_updown_history` ADD CONSTRAINT `rate_updown_history_battle_history_id_user_id_fkey` FOREIGN KEY (`battle_history_id`, `user_id`) REFERENCES `battle_history`(`id`, `users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moral_updown_history` ADD CONSTRAINT `moral_updown_history_battle_history_id_user_id_fkey` FOREIGN KEY (`battle_history_id`, `user_id`) REFERENCES `battle_history`(`id`, `users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moral_violation_history` ADD CONSTRAINT `moral_violation_history_battle_history_id_user_id_fkey` FOREIGN KEY (`battle_history_id`, `user_id`) REFERENCES `battle_history`(`id`, `users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moral_violation_history` ADD CONSTRAINT `moral_violation_history_moral_violation_category_id_fkey` FOREIGN KEY (`moral_violation_category_id`) REFERENCES `moral_violation_category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- usersテーブル「レート」「モラルスコア」のCHECK制約を記載
ALTER TABLE `users`
    ADD CONSTRAINT `chk_users_rate` CHECK (`rate` BETWEEN 0 AND 9999),
    ADD CONSTRAINT `chk_users_moral_score` CHECK (`moral_score` BETWEEN 0 AND 9999);