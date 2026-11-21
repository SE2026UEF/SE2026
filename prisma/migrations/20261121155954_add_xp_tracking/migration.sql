-- CreateTable
CREATE TABLE `players` (
    `tag` VARCHAR(15) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tag`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xp_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `playerTag` VARCHAR(15) NOT NULL,
    `expLevel` INTEGER NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `xp_snapshots_playerTag_recordedAt_idx`(`playerTag`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `xp_snapshots` ADD CONSTRAINT `xp_snapshots_playerTag_fkey` FOREIGN KEY (`playerTag`) REFERENCES `players`(`tag`) ON DELETE CASCADE ON UPDATE CASCADE;
