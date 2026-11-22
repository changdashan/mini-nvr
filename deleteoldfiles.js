
const fs = require('fs');
const path = require('path');
const settings = require('./server_settings.js');

/**
 * Delete files older than a specified number of days.
 *
 * @param {string} folderPath - Root folder to scan.
 * @param {number} days - Delete files older than this many days.
 * @returns {Promise<number>} Number of files deleted.
 */
async function deleteOldFiles(folderPath, days) {
    if (!Number.isFinite(days) || days < 0) {
        throw new Error('days must be a non-negative number.');
    }

    const rootPath = path.resolve(folderPath);

    // Verify that the specified folder exists.
    const rootStat = await fs.promises.stat(rootPath);

    if (!rootStat.isDirectory()) {
        throw new Error('The specified path is not a folder.');
    }

    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    async function scanFolder(currentPath) {
        const entries = await fs.promises.readdir(
            currentPath,
            { withFileTypes: true }
        );

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            try {
                if (entry.isDirectory()) {
                    // Recursively scan subfolders.
                    await scanFolder(fullPath);
                } else if (entry.isFile()) {
                    const stats = await fs.promises.stat(fullPath);

                    if (stats.mtimeMs < cutoffTime) {
                        await fs.promises.unlink(fullPath);
                        deletedCount++;

                        console.log(`Deleted: ${fullPath}`);
                    }
                }
            } catch (err) {
                console.error(
                    `Failed to process ${fullPath}: ${err.message}`
                );
            }
        }
    }

    await scanFolder(rootPath);

    console.log(`Total files deleted: ${deletedCount}`);

    return deletedCount;
}

//module.exports = { deleteOldFiles }

async function main() {
    const footage_retention_days = settings.FOOTAGE_RETENTION_DAYS;
    let folder = path.join(__dirname, '/public/footage_reviewer/motion_footages');
    let count = await deleteOldFiles(folder, footage_retention_days);
    console.log(`Cleanup completed for ${folder}. ${count} files deleted.`);

    const recording_retention_days = settings.RECORDING_RETENTION_DAYS;
    folder = path.join(__dirname, '/srvr_recordings/');
    count = await deleteOldFiles(folder, recording_retention_days);
    console.log(`Cleanup completed for ${folder}. ${count} files deleted.`);    
}

main().catch(console.error);
