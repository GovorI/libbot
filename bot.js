const telegram = require('node-telegram-bot-api')
require('dotenv/config')
const fs = require('fs')
const path = require('path')
const bot = new telegram(process.env.TELEGRAM_TOKEN, { polling: true })

let filesPath = []
let users = []

bot.on('polling_error', console.log)

bot.setMyCommands([
    { command: '/start', description: 'Запуск' }
])

bot.on('message', (msg) => {
    let chatId = msg.chat.id
    let text = msg.text
    // console.log(msg)
    if (text === '/start') {
        console.log(isUserSave(chatId))
        if(isUserSave(chatId)){
            bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name}!`)
            
            const index = users.findIndex(u => u.userId === chatId)
            // console.log(index)
            if (index !== -1) {
                users.splice(index, 1)
            }
            createUser(msg, './data')
            let user = findUser(chatId)
            // console.log(users)
            let buttons = viewButtons(user.path, chatId)
            user.buttons = buttons
        }else {
            bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name}!`)
            createUser(msg, './data')
            let user = findUser(chatId)
            let buttons = viewButtons(user.path, chatId)
            user.buttons = buttons
        }
        // if (isUserSave(chatId)) {
        //     bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name}!`)
        //     let user = findUser(chatId)
        //     console.log(user)
        //     viewButtons(user.Path, chatId)

        // } else {
        //     createUser(msg, './data')
        //     let user = findUser(chatId)
        //     let buttons = viewButtons(user.Path, chatId)
        //     user.buttons = buttons
        //     // console.log(buttons)
        // }
    }
    console.log(users)
    processing(chatId, text)
})

bot.on('callback_query', (msg) => {
    const chatId = msg.message.chat.id
    const data = msg.data
    // console.log(msg)
    sendFile(chatId, data)
})

function userInfo(user){
    console.log(user.userId)
    console.log(user.firstName)
    for(let i =0; i<user.buttons.length; i++){
        console.log(user.buttons[i])
    }
}

function sendFile(chatId, fileId) {
    for (let i = 0; i < filesPath.length; i++) {
        if (fileId === filesPath[i].id) {
            try {
                let fileName = filesPath[i].path.split('.')
                console.log(fileName[fileName.length - 1])
                if (fileName[fileName.length - 1].toString() == ('mp4' || 'avi')) {
                    bot.sendMessage(chatId, 'Загрузка видео...')
                    fs.readFile(filesPath[i].path, (err, video) => {
                        if (err) console.log(err)
                        bot.sendVideo(chatId, video)
                    })
                } else {
                    bot.sendDocument(chatId, filesPath[i].path)
                }

            } catch (error) {
                console.log(error)
            }
        }
    }
}

function processing(chatId, text) {
    let user = findUser(chatId)
    user.buttons.forEach(button => {
        if (button[0].text === text) {
            let buttons = viewButtons(button[0].callback_data, chatId)
            user.buttons = buttons
            user.path = button[0].callback_data
            userInfo(user)
        }
    });

}

function findUser(chatId) {
    let findedUser
    users.forEach(user => {
        if (user.userId === chatId) {
            // console.log('findUser' + user)
            findedUser = user
        }

    });
    return findedUser
}

function isUserSave(chatId) {
    for (let user of Object.values(users)) {
        // console.log(user)
        if (user.userId === chatId) {
            // console.log(user)
            return true
        }
    }
    return false
}

function createUser(msg, path) {
    let id = msg.from.id
    let firstName = msg.from.first_name
    users.push({
        userId: id,
        firstName: firstName,
        path: path,
        buttons: []
    })
}

function getFiles(path, files_) {
    files_ = files_ || []
    var files = fs.readdirSync(path)
    for (var i in files) {
        var name = path + '/' + files[i]
        files_.push(name)
    }
    // console.log('Files----->' + files_)
    return files_
}

function viewButtons(path, chatId) {
    let files = getFiles(path)
    let menuButtons = []
    let filesButtons = []
    let i = 0
    filesPath = []
    files.forEach(element => {
        // console.log(element)
        let text = element.split('/')
        if (fs.statSync(element).isDirectory()) {
            menuButtons.push([{ 'text': text[text.length - 1], 'callback_data': element }])
        } else if (fs.statSync(element).isFile()) {
            filesButtons.push([{ 'text': text[text.length - 1], 'callback_data': i.toString() }])
            filesPath.push({ id: i.toString(), path: element })
            // console.log(filesPath)
            i++
        }
    });

    menuButtons.push([{ 'text': 'Главное меню', 'callback_data': './data' }])

    // console.log('Buttons' + JSON.stringify(menuButtons))
    // console.log('Files' + JSON.stringify(filesButtons))

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
    return menuButtons
}