-- AlterTable
ALTER TABLE `url_data` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `Click` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url_id` VARCHAR(191) NOT NULL,
    `clicked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `device_type` VARCHAR(191) NULL,
    `referrer` TEXT NULL,

    INDEX `Click_url_id_idx`(`url_id`),
    INDEX `Click_clicked_at_idx`(`clicked_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Click` ADD CONSTRAINT `Click_url_id_fkey` FOREIGN KEY (`url_id`) REFERENCES `url_data`(`url_id`) ON DELETE CASCADE ON UPDATE CASCADE;
