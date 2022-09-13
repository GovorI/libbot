const telegram = require('node-telegram-bot-api')
require('dotenv/config')
const fs = require('fs')
const bot = new telegram(process.env.TELEGRAM_TOKEN, { polling: true })
const User = require('./User')
const i = 326268494
const admin = 431983680
const mainMenu = createButtons('./data')
console.log(admin)
bot.on('polling_error', console.log)

bot.setMyCommands([
    { command: '/start', description: 'Запуск' }
])

bot.on('message', async (msg) => {
    const id = msg.chat.id
    const name = msg.from.first_name
    const text = msg.text
    console.log('isAdminDontCreated ' + Boolean(await User.getUserById(admin) === undefined))
    if (await User.getUserById(admin) === undefined || await User.getUserById(i) === undefined) {
        const users = await User.getAll()
        console.log(users)
        if (users.length === 0) {
            await User.saveUser(new User(admin, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
            await User.saveUser(new User(i, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
            viewButtons(id, mainMenu.menuButtons, mainMenu.filesButtons)
        } else {
            var i_ = users.find(u => u.id === i)
            var admin_ = users.find(u => u.id === admin)
            if (i_ === undefined) {
                await User.saveUser(new User(i, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
            } else if (admin_ === undefined) {
                await User.saveUser(new User(admin, 'name', './data', mainMenu.menuButtons, mainMenu.filesButtons))
            }
        }
    } else {
        const user = await User.getUserById(id)
        console.log(id)
        if (user || admin === id || i === id) {
            console.log('isUserCreated ' + Boolean(user))
            if (text === '/start') {
                const buttons = createButtons('./data')
                const user = await User.updateUser(id, name, './data', buttons.menuButtons, buttons.filesButtons)
                // console.log(user)
                viewButtons(id, buttons.menuButtons, buttons.filesButtons)
            } else {
                console.log('isUserCreated ' + Boolean(user))
                if (user) {
                    for (let i of user.menuButtons) {
                        if (i[0].text === text) {
                            let buttons = createButtons(i[0].callback_data)
                            // console.log(buttons)
                            await User.updateUser(id, name, i[0].callback_data, buttons.menuButtons, buttons.filesButtons)
                            viewButtons(id, buttons.menuButtons, buttons.filesButtons)
                        }
                    }
                } else if (user === 'undefined') {
                    bot.sendMessage(msg.chat.id, 'У вас нет доступа1')
                }
            }
        } else {
            bot.sendMessage(msg.chat.id, 'У вас нет доступа2')
        }
    }
})

bot.on('callback_query', (msg) => {
    const chatId = msg.message.chat.id
    const fileId = msg.data
    console.log(fileId)
    sendFile(chatId, fileId)
})

bot.onText(/\/add\s\d+/, (msg, match) => {
    const chatId = msg.from.id
    if (chatId === admin || chatId === i) {
        let id = Number(match[0].split(' ')[1])
        const user = new User(id, 'name', './data', [], [])
        // console.log(user)
        const answerText = User.saveUser(user)
        console.log(answerText)
        bot.sendMessage(chatId, `Пользователь с ID: ${user.id} добавлен`)

    } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
})

bot.onText(/\/del\s\d+/, async (msg, match) => {
    const chatId = msg.from.id
    if (chatId === admin || chatId === i) {
        let id = match[0].split(' ')[1]
        const deletedUser = await User.delete(Number(id))
        console.log(deletedUser)
        if (deletedUser) {
            bot.sendMessage(chatId, `Пользователь c ID: ${deletedUser[0].id} удален`)
        } else bot.sendMessage(chatId, `Пользователя с ID: ${id} нет в списке`)
    } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
})

bot.onText(/\/all/, async (msg, match) => {
    const chatId = msg.chat.id
    if (chatId === admin || chatId === i) {
        const list = await User.getAll()
        if (list.length > 0) {
            for (let user of list) {
                bot.sendMessage(chatId, `ID: ${user.id} Name: ${user.name}`)
            }
        } else bot.sendMessage(chatId, 'Нет добавленных пользователей')
    } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
})

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
    // console.log(m lesButtons)
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