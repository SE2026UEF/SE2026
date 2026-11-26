-- CreateTable
CREATE TABLE `heist_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `playerTag` VARCHAR(15) NOT NULL,
    `darkElixirLooted` INTEGER NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `heist_snapshots_playerTag_recordedAt_idx`(`playerTag`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `heist_snapshots` ADD CONSTRAINT `heist_snapshots_playerTag_fkey` FOREIGN KEY (`playerTag`) REFERENCES `players`(`tag`) ON DELETE CASCADE ON UPDATE CASCADE;
