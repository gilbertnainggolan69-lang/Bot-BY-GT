cat > index.js << 'EOF'
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'

const BOT_NAME = "GILBERT"

async function startGilbert() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        markOnlineOnConnect: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        getMessage: async () => undefined
    })

    if (!sock.authState.creds.registered) {
        console.log(`\n🔥 ${BOT_NAME} BELUM TERHUBUNG\nMasukin nomor WA lu (contoh 62812xxxx):`)
        // GANTI NOMOR LU DISINI BRO
        const nomor = "628xxxxxxxxxx"
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(nomor.replace(/[^0-9]/g,''))
                console.log(`\n╔════════════════════╗\n║ KODE GILBERT: ${code} ║\n╚════════════════════╝\nBuka WA > Perangkat Tertaut > Tautkan dgn nomor telepon`)
            } catch(e){ console.log("Nomor salah bro, edit index.js") }
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) startGilbert()
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
        const cmd = text.slice(1).toLowerCase().split(" ")[0]

        if (cmd === "ping" || cmd === "p") {
            await sock.sendMessage(jid, { text: `*Pong!* 🏓\nBot: ${BOT_NAME} Aktif\nUptime: anti nyinkron` }, { quoted: m })
        }

        if (cmd === "menu" || cmd === "gilbert") {
            const menu = `
𝗛𝗮𝗹𝗼 ${BOT_NAME} 👋

> I'm *${BOT_NAME}*, your intelligent assistant powered by *${BOT_NAME}*. Whether you need information, entertainment, or utilities, I'm always ready to help.

╭─「 Information 」
╎➮ User : ${BOT_NAME}
╎➮ Role : Owner
╎➮ Prefix : ${prefix}
╎➮ Uptime : Online
╰───────────

╭─「 ${BOT_NAME} TOOLS 」
╎➮ .ping - cek bot hidup
╎➮ .menu / .gilbert - menu ini
╎➮ .sticker - bikin stiker (kirim gambar + caption .sticker)
╎➮ .owner - info owner
╰───────────

*Powered by ${BOT_NAME} - Fix Bytes Error*
`
            await sock.sendMessage(jid, { text: menu }, { quoted: m })
        }
    })
}

startGilbert()
EOF

Tarok ini
