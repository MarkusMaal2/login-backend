const mysql = require(`mysql-await`);
const logger = require("./logger");

const connection = mysql.createConnection({
    host: 'bdlcxot20d5o5e3kbaaf-mysql.services.clever-cloud.com',
    user: 'ux5actretttpohqf',
    password: 'X6UJ23VfS7uudaL6Knws',
    database: 'bdlcxot20d5o5e3kbaaf',
});

connection.connect((err) => {
    if (err) {
        logger("Server", 'Error connecting to MySQL:' + err, true);
        return;
    }
    logger("Server", 'Connected to MySQL database');
});

module.exports = connection