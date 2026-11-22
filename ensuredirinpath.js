const path = require('path');

/**
 * Checks if a directory is in the PATH and appends it if missing.
 * @param {string} dirToAdd - The absolute or relative path of the directory.
 */
function ensureDirInPath(dirToAdd) {
    // 1. Resolve to an absolute path to ensure accurate comparison
    const absoluteDir = path.resolve(dirToAdd);

    // 2. Get the platform-specific delimiter (':' on Linux/macOS, ';' on Windows)
    const delimiter = path.delimiter;

    // 3. Retrieve the current PATH string, defaulting to an empty string if undefined
    const currentPathStr = process.env.PATH || '';

    // 4. Split the path and look for a normalized match
    // We resolve each path to handle variations in trailing slashes or relative segments
    const pathEntries = currentPathStr.split(delimiter).map(p => path.resolve(p));

    if (!pathEntries.includes(absoluteDir)) {
        // 5. Append the directory to process.env.PATH if it doesn't exist
        process.env.PATH = `${currentPathStr}${delimiter}${absoluteDir}`;
        console.log(`✅ Added to PATH: ${absoluteDir}`);
    } else {
        console.log(`ℹ️ Directory already exists in PATH.`);
    }
}

// Example usage:
//ensureDirInPath('./bin'); 
module.exports = ensureDirInPath;
