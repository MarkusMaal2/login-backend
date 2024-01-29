const app = require("./app");
const logger = require("./utils/logger");
const ca = require("./utils/ca");

let port = process.env.PORT || 3001
try {
    const httpsServer = ca;

    httpsServer.listen(port, () => {
        logger("Server", `API running at https://localhost:${port}`);
    })
} catch (e) {
    logger("Server", "Failed to load SSL certificates, falling back to HTTP only mode", true)
    app.listen(port);
    logger("Server", `API running at https://localhost:${port}`);
}