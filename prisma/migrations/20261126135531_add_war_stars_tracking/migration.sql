-- CreateTable
CREATE TABLE `war_stars_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `playerTag` VARCHAR(15) NOT NULL,
    `warStars` INTEGER NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `war_stars_snapshots_playerTag_recordedAt_idx`(`playerTag`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `war_stars_snapshots` ADD CONSTRAINT `war_stars_snapshots_playerTag_fkey` FOREIGN KEY (`playerTag`) REFERENCES `players`(`tag`) ON DELETE CASCADE ON UPDATE CASCADE;
