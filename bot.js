const telegram = require('node-telegram-bot-api')
require('dotenv/config')
const fs = require('fs')
const bot = new telegram(process.env.TELEGRAM_TOKEN, { polling: true })
const User = require('./User')
const i = process.env.ADMIN
const admin = process.env.ADMIN2
const mainMenu = createButtons('./data')
bot.on('polling_error', console.log)

bot.setMyCommands([
    { command: '/start', description: 'Запуск' }
])



bot.on('message', async (msg) => {
    await createAdmins()
    const chatId = msg.chat.id
    const name = msg.from.first_name
    const text = msg.text
    console.log(msg)
    console.log('isAdminCreated ' + Boolean(await User.getUserById(admin) !== undefined))
    const user = await User.getUserById(chatId)
    console.log('user Id: ' + chatId)
    console.log('isUserAdded: ' + user)
    if (user || admin === chatId || i === chatId) {
        console.log('isUserCreated ' + Boolean(user))
        if (/\/start/.test(text)) {
            const buttons = createButtons('./data')
            await User.updateUser(chatId, name, './data', buttons.menuButtons, buttons.filesButtons)
            viewButtons(chatId, buttons.menuButtons, buttons.filesButtons)
        } else if (/\/add\s\d+/.test(text)) {
            if (chatId === admin || chatId === i) {
                let id = Number(text.split(' ')[1])
                if (await User.getUserById(id)) {
                    bot.sendMessage(chatId, `Пользователь с ID: ${id} уже есть в списке`)
                } else {
                    const user = new User(id, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons)
                    console.log(user)
                    const answerText = await User.saveUser(user)
                    console.log(answerText)
                    bot.sendMessage(chatId, `Пользователь с ID: ${user.id} добавлен`)
                    bot.sendMessage(id, 'Вы получили доступ')
                }
            } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
        } else if (/\/del\s\d+/.test(text)) {
            if (chatId === admin || chatId === i) {
                let id = Number(text.split(' ')[1])
                const deletedUser = await User.delete(id)
                console.log(deletedUser)
                if (deletedUser) {
                    bot.sendMessage(chatId, `Пользователь c ID: ${id} удален`)
                } else bot.sendMessage(chatId, `Пользователя с ID: ${id} нет в списке`)
            } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
        } else if (/\/all/.test(text)) {
            if (chatId === admin || chatId === i) {
                const list = await User.getAll()
                if (list.length > 0) {
                    for (let u of list) {
                        const user = await User.getUserById(u.split('.')[0])
                        bot.sendMessage(chatId, `ID: ${user.id} Name: ${user.name}`)
                    }
                } else bot.sendMessage(chatId, 'Нет добавленных пользователей')
            } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
        } else if (/\/post/.test(text)) {
            if (chatId === admin || chatId === i) {
                const mesArr = text.split(' ')
                mesArr.splice(0, 1)
                const mes = mesArr
                console.log(mesArr)
                const users = await User.getAll()
                for (let u of users) {
                    try {
                        const user = await User.getUserById(u.split('.')[0])
                        bot.sendMessage(user.id, mes.join(' '))
                    } catch (error) {
                        console.log(error)
                    }
                }
            } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
        } else {
            if (await action(chatId, text, user, name)) {
                console.log(user.path)
            } else bot.sendMessage(chatId, 'чтобы начать нажмите /start')
        }

    } else {
        bot.sendMessage(msg.chat.id, 'У вас нет доступа')
    }
})

bot.on('callback_query', (msg) => {
    const chatId = msg.message.chat.id
    const fileId = msg.data
    console.log(fileId)
    sendFile(chatId, fileId)
})

async function action(chatId, text, user, name) {
    let stat = false
    try {
        for (let i of user.menuButtons) {
            if (i[0].text === text) {
                let buttons = createButtons(i[0].callback_data)
                console.log(`Пользователь: ${user}`)
                console.log(text)
                await User.updateUser(chatId, name, i[0].callback_data, buttons.menuButtons, buttons.filesButtons)
                viewButtons(chatId, buttons.menuButtons, buttons.filesButtons)
                stat = true
            }
        }
        return stat
    } catch (error) {
        console.log(error)
        bot.sendMessage(chatId, 'чтобы начать нажмите /start ')
    }
}

async function createAdmins() {
    const users = await User.getAll()
    console.log('length' + Boolean(users.length === 0))
    if (users.length === 0) {
        await User.saveUser(new User(admin, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
        await User.saveUser(new User(i, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
    } else {
        console.log('----->' + users[0].split('.')[0])
        var i_ = users.find(u => Number(u.split('.')[0]) === i)
        var admin_ = users.find(u => Number(u.split('.')[0]) === admin)
        console.log('USERS: ' + i_ + admin_)
        if (i_ === undefined) {
            await User.saveUser(new User(i, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
        } else if (admin_ === undefined) {
            await User.saveUser(new User(admin, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
        }
    }
}

async function sendFile(chatId, fileId) {
    let user = await User.getUserById(chatId)
    let buttons = user.filesButtons
    for (let button of buttons) {
        if (fileId === button[0].callback_data) {
            let ext = button[0].text.split('.')
            let path = user.path.toString()
            path += '/' + button[0].text.toString()
            if (ext[ext.length - 1] === ('mp4' || 'avi')) {
                bot.sendMessage(chatId, 'Загрузка видео...')
                fs.readFile(path, (err, video) => {
                    if (err) console.log(err)
                    bot.sendVideo(chatId, video)
                    console.log(path)
                })
            } else {
                bot.sendDocument(chatId, path)
                console.log(path)
            }
        }
    }
}

function getFiles(path, files_) {
    files_ = files_ || []
    var files = fs.readdirSync(path)
    for (var i in files) {
        var name = path + '/' + files[i]
        files_.push(name)
    }
    return files_
}

function createButtons(path) {
    let files = getFiles(path)
    let menuButtons = []
    let filesButtons = []
    let i = 0
    filesPath = []
    files.forEach(element => {
        let text = element.split('/')
        if (fs.statSync(element).isDirectory()) {
            menuButtons.push([{ 'text': text[text.length - 1], 'callback_data': element }])
        } else if (fs.statSync(element).isFile()) {
            filesButtons.push([{ 'text': text[text.length - 1], 'callback_data': i.toString() }])
            filesPath.push({ id: i.toString(), path: element })
            i++
        }
    });

    if (path != './data') {
        menuButtons.push([{ 'text': 'Главное меню', 'callback_data': './data' }])
    }
    return {
        menuButtons: menuButtons,
        filesButtons: filesButtons
    }
}

function viewButtons(chatId, menuButtons, filesButtons) {
    bot.sendMessage(chatId, 'Выберите пункт меню', {
        reply_markup: JSON.stringify({
            keyboard: menuButtons
        })
    })
    if (filesButtons.length > 0) {
        bot.sendMessage(chatId, 'Выберите файл', {
            reply_markup: JSON.stringify({
                inline_keyboard: filesButtons
            })
        })
    }
}