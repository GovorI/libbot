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
                    resolve(JSON.parse(data))
                }
            )
        })
    }

    static async saveUser(user) {
        const users = await User.getAll()
        users.push(user)
        console.log(users)
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
        for (let i in users){
            console.log(i)
            console.log(userId)
            console.log(users[i].id)
            if(users[i].id === userId){
                const deleted = users.splice(i, 1)
                console.log(deleted)
                fs.writeFile('./usersId.json', JSON.stringify(users), (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
                return deleted
            }
        }
        
    }
}

module.exports = User