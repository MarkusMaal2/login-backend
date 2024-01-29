const BaseModel = require("./base.model")

class LoginModel extends BaseModel {
    constructor() {
        super("users");
    }

    async findAll() {
        return await super.findAll();
    }

    async findById(id) {
        return await super.findById(id)
    }

    async findByCredentials(username, hash) {
        return await super.executeQuery(`SELECT * FROM users WHERE NAME = "${username}" AND HASH = "${hash}"`)
    }

    async findByName(username) {
        return await super.findOne("NAME", username);
    }

    async create(user) {
        return await super.create(user);
    }

    async updateDetails(id, name, hash) {
        return await super.update(id, `NAME="${name}"`) && await super.update(id, `HASH="${hash}"`);
    }

    async delete(id) {
        return await super.delete(id);
    }
}

module.exports = LoginModel