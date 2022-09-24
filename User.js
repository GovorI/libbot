const fs = require('fs')


class User {
    constructor(id, name, path, menuButtons, filesButtons) {
        this.id = id
        this.name = name
        this.path = path
        this.menuButtons = menuButtons
        this.filesButtons = filesButtons
    }


    static getAll() {
        return new Promise((resolve, reject) => {
            fs.readFile(
                './usersId.json',
                'utf-8',
                (err, data) => {
                    if (err) reject(err)
                    try {
                        resolve(JSON.parse(data))
                    } catch (error) {
                        console.log(error)
                    }
                }
            )
        })
    }

    static async saveUser(user) {
        const users = await User.getAll()
        users.push(user)
        fs.writeFile(
            './usersId.json',
            JSON.stringify(users),
            (err) => {
                if (err) {
                    console.log(err)
                    return "не удалось сохранить пользователя"
                }
            })
        return "пользователь успешно сохранен"
    }

    static async updateUser(id, name, path, menuButtons, filesButtons) {
        const users = await User.getAll()
        let idx = users.findIndex(u => u.id === id)
        const user = users[idx]
        user.id = id
        user.name = name
        user.path = path
        user.menuButtons = menuButtons
        user.filesButtons = filesButtons
        users[idx] = user
        fs.writeFile(
            './usersId.json',
            JSON.stringify(users),
            (err) => {
                if (err) {
                    console.log(err)
                    return "не удалось сохранить пользователя"
                }
            })
        return "пользователь успешно сохранен"
    }

    static async getUserById(id) {
        const users = await User.getAll()
        return users.find(user => user.id === id)
    }

    static async delete(userId) {
        const users = await User.getAll()
        console.log(users)
        for (let i in users) {
            if (users[i].id === userId) {
                let delUser = await users.splice(i, 1)
                fs.writeFile(
                    './usersId.json',
                    JSON.stringify(users),
                    (err) => {
                        if (err) {
                            console.log(err)
                            return false
                        }
                    })
                return delUser
            }
        }

    }
}

module.exports = User