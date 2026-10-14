import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'

const BOT_NAME = "GILBERT"

// === ANTI SPAM TOTAL BY GILBERT ===
const origLog = console.log
const origError = console.error
const origWarn = console.warn

function isSpam(txt){
  return txt.includes('Bad MAC') ||
         txt.includes('Failed to decrypt') ||
         txt.includes('SessionEntry') ||
         txt.includes('Closing session') ||
         txt.includes('currentRatchet') ||
         txt.includes('Decrypted message') ||
         txt.includes('Session error')
}

console.log = (...args) => {
  if (isSpam(args.join(' '))) return
  origLog(...args)
}
console.error = (...args) => {
  if (isSpam(args.join(' '))) return
  origError(...args)
}
console.warn = (...args) => {
  if (isSpam(args.join(' '))) return
  origWarn(...args)
}
// =================================

async function startGilbert() {
    if (!fs.existsSync('./plugins')) fs.mkdirSync('./plugins')
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        fireInitQueries: false,
        markOnlineOnConnect: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        getMessage: async () => undefined
    })

    if (!sock.authState.creds.registered) {
        console.log(`\n🔥 ${BOT_NAME} BELUM TERHUBUNG`)
        const nomor = "6285820673526"
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(nomor.replace(/[^0-9]/g,''))
                console.log(`\n╔════════════════════════╗\n║ KODE GILBERT: ${code} ║\n╚════════════════════════╝\nBuka WA > Perangkat Tertaut > Tautkan dgn nomor telepon`)
            } catch(e){ console.log("Nomor salah bro, edit index.js", e.message) }
        }, 4000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            if (reason!== DisconnectReason.loggedOut) startGilbert()
        }
        if (connection === 'open') {
            console.log(`\n✅ HALO ${BOT_NAME} TERHUBUNG ANTI BYTES ERROR!`)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const jid = m.key.remoteJid
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
        const prefix = "."
        if (!text.startsWith(prefix)) return
        const args = text.slice(1).trim().split(/ +/)
        const cmd = args.shift().toLowerCase()

        if (cmd === "ping" || cmd === "p") {
            await sock.sendMessage(jid, { text: `*Pong!* 🏓\nBot: ${BOT_NAME} Aktif` }, { quoted: m })
        }

        if (cmd === "menu" || cmd === "gilbert") {
            let pluginList = fs.readdirSync('./plugins').filter(f => f.endsWith('.js')).map(f => `│ ◦.${f.replace('.js','')}`).join('\n') || "│ ◦ Belum ada plugin"
            const menu = `
┏━━━━━━━━━━━━━━━━━━┓
┃ 🤖 ${BOT_NAME} BOT ┃
┗━━━━━━━━━━━━━━━━━━┛
┏━『 INFO BOT 』━┓
│ User: ${BOT_NAME}
│ Prefix: ${prefix}
│ Uptime: Online
┗━━━━━━━━━━━━━━┛
┏━『 MAIN MENU 』━┓
│ ◦.ping
│ ◦.menu
│ ◦.gilbert
│ ◦.sticker
│ ◦.owner
┗━━━━━━━━━━━━━━┛
┏━『 OWNER MENU 』━┓
│ ◦.addplugin
│ ◦.delplugin
┗━━━━━━━━━━━━━━┛
┏━『 PLUGIN LIST 』━┓
${pluginList}
┗━━━━━━━━━━━━━━┛
*Powered by ${BOT_NAME} - Fix Bytes Error*
`
            await sock.sendMessage(jid, { text: menu }, { quoted: m })
        }

        if (cmd === "owner") {
            await sock.sendMessage(jid, { text: `Owner: wa.me/6285820673526` }, { quoted: m })
        }

        if (cmd === "addplugin") {
            const nama = args[0]
            if (!nama) return sock.sendMessage(jid, { text: "Contoh:.addplugin hai\nawait sock.sendMessage(jid,{text:'halo'},{quoted:m})" }, { quoted: m })
            let kode = text.split("\n").slice(1).join("\n")
            if (!kode) return sock.sendMessage(jid, { text: "Kodenya mana bro? Kirim kayak gini:\n.addplugin tes\nawait sock.sendMessage(jid,{text:'tes'},{quoted:m})" }, { quoted: m })
            fs.writeFileSync(`./plugins/${nama}.js`, kode)
            await sock.sendMessage(jid, { text: `✅ Plugin ${nama}.js berhasil ditambahkan!` }, { quoted: m })
        }

        if (cmd === "delplugin") {
            const nama = args[0]
            if (!nama) return sock.sendMessage(jid, { text: "Contoh:.delplugin hai" }, { quoted: m })
            const path = `./plugins/${nama}.js`
            if (!fs.existsSync(path)) return sock.sendMessage(jid, { text: `❌ Plugin ${nama}.js gak ada!` }, { quoted: m })
            fs.unlinkSync(path)
            await sock.sendMessage(jid, { text: `🗑️ Plugin ${nama}.js dihapus!` }, { quoted: m })
        }

        try {
            const pluginPath = `./plugins/${cmd}.js`
            if (fs.existsSync(pluginPath)) {
                const code = fs.readFileSync(pluginPath, 'utf-8')
                const run = new Function('sock','jid','m','args','text','fs', `return (async()=>{${code}})()`)
                await run(sock, jid, m, args, text, fs)
            }
        } catch(e){
            await sock.sendMessage(jid, { text: `Error plugin ${cmd}: ${e.message}` }, { quoted: m })
        }
    })
}

startGilbert()
