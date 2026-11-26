-- CreateTable
CREATE TABLE `league_tiers` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `iconUrl` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `league_season_results` (
    `playerTag` VARCHAR(15) NOT NULL,
    `seasonId` INTEGER NOT NULL,
    `leagueTierId` INTEGER NOT NULL,
    `leagueTrophies` INTEGER NOT NULL,
    `placement` INTEGER NOT NULL,
    `attackWins` INTEGER NOT NULL,
    `attackLosses` INTEGER NOT NULL,
    `defenseWins` INTEGER NOT NULL,
    `defenseLosses` INTEGER NOT NULL,
    `defenseStars` INTEGER NOT NULL,
    `maxBattles` INTEGER NOT NULL,

    PRIMARY KEY (`playerTag`, `seasonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `league_season_results` ADD CONSTRAINT `league_season_results_playerTag_fkey` FOREIGN KEY (`playerTag`) REFERENCES `players`(`tag`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `league_season_results` ADD CONSTRAINT `league_season_results_leagueTierId_fkey` FOREIGN KEY (`leagueTierId`) REFERENCES `league_tiers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
