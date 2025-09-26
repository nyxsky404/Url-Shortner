-- CreateTable
CREATE TABLE `url_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url_id` INTEGER NOT NULL,
    `org_url` VARCHAR(191) NOT NULL,
    `shorter_url` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `url_data_url_id_key`(`url_id`),
    UNIQUE INDEX `url_data_org_url_key`(`org_url`),
    UNIQUE INDEX `url_data_shorter_url_key`(`shorter_url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
