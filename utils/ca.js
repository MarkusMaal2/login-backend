const fs = require("fs");
const path = require("path");
const logger = require("./logger");
const https = require("https");
const app = require("../app");

const getCert = () => {
    try {
        const privateKeyPath = path.join(__dirname, "..", 'client-key.pem');
        const certificatePath = path.join(__dirname, "..", 'client-cert.pem');

        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const certificate = fs.readFileSync(certificatePath, 'utf8');

        const credentials = {key: privateKey, cert: certificate};

        logger("Server", "SSL certificates found and loaded")

        return https.createServer(credentials, app);
    } catch (e) {
        return null;
    }
}


module.exports = getCert()