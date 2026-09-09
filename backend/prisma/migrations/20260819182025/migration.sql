/*
  Warnings:

  - You are about to drop the column `battle_history_id` on the `moral_updown_history` table. All the data in the column will be lost.
  - You are about to drop the column `battle_history_id` on the `moral_violation_history` table. All the data in the column will be lost.
  - You are about to drop the column `battle_history_id` on the `rate_updown_history` table. All the data in the column will be lost.
  - You are about to drop the `battle_history` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[debate_history_id,user_id]` on the table `moral_updown_history` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[debate_history_id,user_id]` on the table `moral_violation_history` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[debate_history_id,user_id]` on the table `rate_updown_history` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `debate_history_id` to the `moral_updown_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debate_history_id` to the `moral_violation_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debate_history_id` to the `rate_updown_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `battle_history` DROP FOREIGN KEY `battle_history_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `moral_updown_history` DROP FOREIGN KEY `moral_updown_history_battle_history_id_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `moral_violation_history` DROP FOREIGN KEY `moral_violation_history_battle_history_id_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `rate_updown_history` DROP FOREIGN KEY `rate_updown_history_battle_history_id_user_id_fkey`;

-- DropIndex
DROP INDEX `moral_updown_history_battle_history_id_user_id_key` ON `moral_updown_history`;

-- DropIndex
DROP INDEX `moral_violation_history_battle_history_id_user_id_key` ON `moral_violation_history`;

-- DropIndex
DROP INDEX `rate_updown_history_battle_history_id_user_id_key` ON `rate_updown_history`;

-- AlterTable
ALTER TABLE `moral_updown_history` DROP COLUMN `battle_history_id`,
    ADD COLUMN `debate_history_id` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `moral_violation_history` DROP COLUMN `battle_history_id`,
    ADD COLUMN `debate_history_id` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `rate_updown_history` DROP COLUMN `battle_history_id`,
    ADD COLUMN `debate_history_id` CHAR(36) NOT NULL;

-- DropTable
DROP TABLE `battle_history`;

-- CreateTable
CREATE TABLE `debate_history` (
    `id` CHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `winner_flag` BOOLEAN NOT NULL,
    `matched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `moral_updown_history_debate_history_id_user_id_key` ON `moral_updown_history`(`debate_history_id`, `user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `moral_violation_history_debate_history_id_user_id_key` ON `moral_violation_history`(`debate_history_id`, `user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `rate_updown_history_debate_history_id_user_id_key` ON `rate_updown_history`(`debate_history_id`, `user_id`);

-- AddForeignKey
ALTER TABLE `debate_history` ADD CONSTRAINT `debate_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rate_updown_history` ADD CONSTRAINT `rate_updown_history_debate_history_id_user_id_fkey` FOREIGN KEY (`debate_history_id`, `user_id`) REFERENCES `debate_history`(`id`, `user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moral_updown_history` ADD CONSTRAINT `moral_updown_history_debate_history_id_user_id_fkey` FOREIGN KEY (`debate_history_id`, `user_id`) REFERENCES `debate_history`(`id`, `user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moral_violation_history` ADD CONSTRAINT `moral_violation_history_debate_history_id_user_id_fkey` FOREIGN KEY (`debate_history_id`, `user_id`) REFERENCES `debate_history`(`id`, `user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
