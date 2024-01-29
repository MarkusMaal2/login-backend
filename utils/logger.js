
const log = (user, task, error = false) => {
    const fs = require('fs')
    const filePath = "./server.log"
    const time = new Date().toLocaleString()
    const content = "[" + time + "] " + user + " - " + task;
    fs.appendFile(filePath, content + "\n", (err) => {
        if (err) {
            console.log("\x1b[0m[" + time + "] Server logging error - " + err + "\n");
        }
    })
    !error?console.log(content):console.error("\x1b[31m" + content + "\x1b[0m");
}

module.exports = log