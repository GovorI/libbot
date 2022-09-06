const telegram = require('node-telegram-bot-api')
require('dotenv/config')
const fs = require('fs')
const bot = new telegram(process.env.TELEGRAM_TOKEN, { polling: true })
const usersMap = new Map()
const i = "telegtam_ID_admin"
const admin = "telegtam_ID_admin"

bot.on('polling_error', console.log)

bot.setMyCommands([
    { command: '/start', description: 'Запуск' }
])

bot.on('message', async (msg) => {
    if (msg.text === '/start') {
        if (await isUser(msg.chat.id)) {
            const buttons = createButtons('./data')
            createUser(msg.chat.id, msg.from.first_name, './data', buttons.menuButtons, buttons.filesButtons)
            viewButtons(msg.chat.id)
        } else bot.sendMessage(msg.chat.id, 'У вас нет доступа')
    } else if (await isUser(msg.chat.id)) {
        let user = usersMap.get(msg.chat.id)
        for (let i of user.menuButtons) {
            if (i[0].text === msg.text) {
                let buttons = createButtons(i[0].callback_data)
                user.path = i[0].callback_data
                user.menuButtons = buttons.menuButtons
                user.filesButtons = buttons.filesButtons
                usersMap.set(msg.chat.id, user)
                viewButtons(msg.chat.id)
                console.log(usersMap)
            }
        }
    }

})

bot.on('callback_query', (msg) => {
    const chatId = msg.message.chat.id
    const fileId = msg.data
    sendFile(chatId, fileId)
})



async function isUser(userId) {
    const ids = await getAll()
    for (let id of ids) {
        if (id === userId) {
            return true
        }
    }
}

function createUser(chatId, name, path, menuButtons, filesButtons) {
    const user = {
        chatId: chatId,
        name: name,
        path: path,
        menuButtons: menuButtons,
        filesButtons: filesButtons
    }
    usersMap.set(chatId, user)
}

function getUserById(id) {
    return usersMap.get(id)
}

bot.onText(/\/add\s\d+/, (msg, match) => {
    const id = msg.from.id
    if (id === admin || id === i) {
        let id = match[0].split(' ')[1]
        saveId(msg.chat.id, Number(id))
    } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
})

bot.onText(/\/del\s\d+/, async (msg, match) => {
    const chatId = msg.from.id
    if (chatId === admin || chatId === i) {
        let id = match[0].split(' ')[1]
        const deletedUser =await delId(msg.chat.id, Number(id))
        if(deletedUser){
            bot.sendMessage(chatId, `Пользователь ${deletedUser} удален`)
        }else bot.sendMessage(chatId, `Пользователя с ID: ${ids} нет в списке`)
    } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
})

bot.onText(/\/all/, async (msg, match) => {
    const chatId = msg.chat.id
    if (chatId === admin || chatId === i) {
        const list = await getAll()
        for (let user of list) {
            bot.sendMessage(chatId, `${user}`)
        }
    } else bot.sendMessage(msg.chat.id, 'У Вас нет прав администратора')
})

async function delId(chatId, userId) {
    const ids = await getAll()
    for (let i in ids) {
        if (ids[i] === userId) {
            const deletedUser = ids.splice(i, 1)  
            fs.writeFile('./usersId.json', JSON.stringify(ids), (err) => {
                if (err) console.log(err)
            })
            return deletedUser
        }
    }
}

async function saveId(chatId, id) {
    const ids = await getAll()
    ids.push(id)
    fs.writeFile('./usersId.json', JSON.stringify(ids), (err) => {
        if (err) console.log(err)
    })
    bot.sendMessage(chatId, `Пользователь с ID: ${id} добавлен`)
}

function getAll() {
    return new Promise((resolve, reject) => {
        fs.readFile('./usersId.json', (err, data) => {
            if (err) reject(err)
            resolve(JSON.parse(data))
        })
    })
}

function sendFile(chatId, fileId) {
    let buttons = usersMap.get(chatId).filesButtons
    for (let button of buttons) {
        if (fileId === button[0].callback_data) {
            let ext = button[0].text.split('.')
            let path = usersMap.get(chatId).path.toString()
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

function viewButtons(chatId) {
    const user = getUserById(chatId)
    console.log(user)
    bot.sendMessage(chatId, 'Выберите пункт меню', {
        reply_markup: JSON.stringify({
            keyboard: user.menuButtons
        })
    })
    if (user.filesButtons.length > 0) {
        bot.sendMessage(chatId, 'Выберите файл', {
            reply_markup: JSON.stringify({
                inline_keyboard: user.filesButtons
            })
        })
    }
}