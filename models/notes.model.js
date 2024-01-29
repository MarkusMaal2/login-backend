const BaseModel = require("./base.model")

class NotesModel extends BaseModel {
    constructor() {
        super("notes");
    }

    async findAll() {
        return await super.findAll();
    }

    async findById(id) {
        return await super.findById(id)
    }
    async create(note) {
        return await super.create(note);
    }

    async updateContent(id, content) {
        return await super.update(id, `CONTENT="${content}"`);
    }

    async delete(id) {
        return await super.delete(id);
    }
}

module.exports = NotesModel