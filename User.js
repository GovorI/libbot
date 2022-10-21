const path = require('path')
const fs = require('fs').promises


class User {
    constructor(id, name, path, menuButtons, filesButtons) {
        this.id = id
        this.name = name
        this.path = path
        this.menuButtons = menuButtons
        this.filesButtons = filesButtons
    }

    static async getAll() {
        try {
            const data = await fs.readdir(
                path.join(__dirname, './users')
            )
            return data
        } catch (error) {
            console.error(error)
        }
    }

    static async saveUser(user) {
        try {
            await fs.writeFile(
                path.join(__dirname, `./users/${user.id}.json`),
                JSON.stringify(user)
            )
        } catch (err) {
            console.error(err)
        }
    }

    static async updateUser(id, name, path, menuButtons, filesButtons) {
        try {
            await fs.writeFile(
                `./users/${id}.json`,
                JSON.stringify({
                    "id": id,
                    "name": name,
                    "path": path,
                    "menuButtons": menuButtons,
                    "filesButtons": filesButtons
                })
            )
        } catch (error) {
            console.error(error)
        }
    }

    static async getUserById(id) {
        try {
            const data = await fs.readFile(
                path.join(__dirname, `./users/${id}.json`),
            )
            return JSON.parse(data.toString())
        } catch (error) {
            console.error(error)
        }
    }

    static async delete(userId) {
        try {
            await fs.unlink(
                path.join(__dirname, `./users/${userId}.json`)
            )
            return true
        } catch (error) {
            
        }
    }
}

module.exports = User