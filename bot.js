const telegram = require('node-telegram-bot-api')
require('dotenv/config')
const fs = require('fs')
const bot = new telegram(process.env.TELEGRAM_TOKEN, { polling: true })
const users = new Map()

bot.on('polling_error', console.log)

bot.setMyCommands([
    { command: '/start', description: 'Запуск' }
])

bot.on('message', (msg) => {
    if (msg.text === '/start') {
            let buttons = createButtons('./data')
            viewButtons(msg.chat.id, buttons.menuButtons, buttons.filesButtons)
            const user = {
                chatId: msg.chat.id,
                name: msg.from.first_name,
                path: './data',
                menuButtons: buttons.menuButtons,
                filesButtons: buttons.filesButtons
            }
            users.set(msg.chat.id, user)
    } else {
        let user = users.get(msg.chat.id)
        for (let i of user.menuButtons) {
            if (i[0].text === msg.text) {
                console.log(i[0].callback_data)
                let buttons = createButtons(i[0].callback_data)
                viewButtons(msg.chat.id, buttons.menuButtons, buttons.filesButtons)
                let user = users.get(msg.chat.id)
                console.log(user)
                console.log(i[0].callback_data)
                user.path = i[0].callback_data
                user.menuButtons = buttons.menuButtons
                user.filesButtons = buttons.filesButtons
                users.set(msg.chat.id, user)
            }
        }
    }

    console.log(users)
})

bot.on('callback_query', (msg) => {
    const chatId = msg.message.chat.id
    const fileId = msg.data
    console.log(msg)
    sendFile(chatId, fileId)
})

function sendFile(chatId, fileId) {
    let buttons = users.get(chatId).filesButtons
    for (let button of buttons) {
        if (fileId === button[0].callback_data) {
            let ext = button[0].text.split('.')
            let path = users.get(chatId).path.toString()
            path += '/'+button[0].text.toString()
            if(ext[ext.length-1]=== ('mp4' || 'avi')){
                bot.sendMessage(chatId, 'Загрузка видео...')
                fs.readFile(path, (err, video)=>{
                    if(err) console.log(err)
                    bot.sendVideo(chatId, video)
                })
            }else {
                bot.sendDocument(chatId, path)
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