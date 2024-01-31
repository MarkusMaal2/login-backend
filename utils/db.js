const mysql = require(`mysql-await`);
const logger = require("./logger");


const Sequelize = require("sequelize")
const sequelize = new Sequelize("mysql://ux5actretttpohqf:X6UJ23VfS7uudaL6Knws@bdlcxot20d5o5e3kbaaf-mysql.services.clever-cloud.com:3306/bdlcxot20d5o5e3kbaaf")

sequelize.authenticate()
    .then(() => {
        logger("Server", "Connected to database!")
    })
    .catch (e => {
        logger("Server", "Unable to connected to database: ", e)
    })

module.exports = sequelize