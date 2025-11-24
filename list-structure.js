const fs = require('fs');
const path = require('path');

function formatMode(stats) {
    let mode = '';

    mode += stats.isDirectory() ? 'd' : '-';
    mode += stats.mode & fs.constants.S_IRUSR ? 'r' : '-';
    mode += stats.mode & fs.constants.S_IWUSR ? 'w' : '-';
    mode += stats.mode & fs.constants.S_IXUSR ? 'x' : '-';
    mode += stats.mode & fs.constants.S_IRGRP ? 'r' : '-';
    mode += stats.mode & fs.constants.S_IWGRP ? 'w' : '-';
    mode += stats.mode & fs.constants.S_IXGRP ? 'x' : '-';
    mode += stats.mode & fs.constants.S_IROTH ? 'r' : '-';
    mode += stats.mode & fs.constants.S_IWOTH ? 'w' : '-';
    mode += stats.mode & fs.constants.S_IXOTH ? 'x' : '-';

    return mode;
}

function formatDate(date) {
    return date.toLocaleString('pt-BR');
}

function listDirectory(dir) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        const Mode = formatMode(stats);
        const LastWriteTime = formatDate(stats.mtime);
        const Length = stats.isFile() ? stats.size : '';
        const Name = item;

        console.log(
            `${Mode.padEnd(20)} ${LastWriteTime.padEnd(22)} ${String(Length).padStart(8)} ${Name}`
        );

        if (stats.isDirectory()) {
            listDirectory(itemPath);
        }
    });
}

console.log("Mode                 LastWriteTime         Length Name");
console.log("----                 -------------         ------ ----");

listDirectory('.');
