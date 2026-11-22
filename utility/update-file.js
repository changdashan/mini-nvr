const fs = require('fs');

function updateFile(filePath, searchForLine, newLine) {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split(/\r?\n/);
    const updatedLines = lines.map(line => {
        if (line.includes(searchForLine)) {
            return newLine;
        }
        return line;
    });
    const updatedData = updatedLines.join('\r\n');
    fs.writeFileSync(filePath, updatedData, 'utf8');
}

module.exports = updateFile;