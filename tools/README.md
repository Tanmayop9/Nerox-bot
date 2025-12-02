# Nerox Server Setup Tool

A standalone Termux-compatible tool to fully setup a Discord support server for Nerox bot.

## Features

- 🔧 **Standalone Tool** - Works independently, not part of the bot
- 📱 **Termux Compatible** - Works on Android via Termux
- 🗑️ **Delete Channels** - Option to delete all existing channels
- 👥 **Create Roles** - Owner, Admin, Moderator, Helper, Member, Muted, Bots
- 📁 **Create Categories** - Information, General, Support, Staff, Logs
- 💬 **Create Text Channels** - With proper topics and permissions
- 🔊 **Create Voice Channels** - General Voice, Music, Support Voice, Staff Voice
- 🔒 **Setup Permissions** - Proper permission overwrites for each role

## Installation

### On PC/Server

```bash
cd tools
npm install
npm start
```

### On Termux (Android)

```bash
# Install Node.js
pkg update && pkg upgrade
pkg install nodejs

# Navigate to tools directory
cd tools

# Install dependencies
npm install

# Run the tool
node server-setup.js
```

## Usage

1. Run the tool:

    ```bash
    node server-setup.js
    ```

2. Enter your Discord Bot Token when prompted

3. Enter the Server (Guild) ID you want to setup

4. Choose whether to delete existing channels (yes/no)

5. Wait for the setup to complete

## Requirements

- Node.js 18.x or higher
- A Discord Bot with Administrator permissions
- The bot must be in the server you want to setup

## Created Structure

### Roles

| Role      | Color     | Permissions                               |
| --------- | --------- | ----------------------------------------- |
| Owner     | Red       | Administrator                             |
| Admin     | Dark Red  | Administrator                             |
| Moderator | Blue      | Manage Messages, Kick, Mute, Move Members |
| Helper    | Green     | Manage Messages, Mute                     |
| Member    | Gray      | View, Send, History, Connect, Speak       |
| Muted     | Dark Gray | View, History only                        |
| Bots      | Purple    | View, Send, Embed, Attach, Connect, Speak |

### Categories & Channels

#### 📢 Information

- `#rules` - Server rules and guidelines
- `#announcements` - Important announcements
- `#updates` - Bot updates and changelogs
- `#faq` - Frequently asked questions

#### 💬 General

- `#general` - General chat
- `#bot-commands` - Use bot commands here
- `#media` - Share images and videos
- `🔊 General Voice`
- `🔊 Music`
- `🔊 Chill Zone`

#### 🎫 Support

- `#support-chat` - Get help with the bot
- `#bug-reports` - Report bugs here
- `#suggestions` - Suggest new features
- `🔊 Support Voice`

#### 🔒 Staff (Hidden from members)

- `#staff-chat` - Staff discussions
- `#mod-commands` - Moderation commands
- `#staff-announcements` - Staff announcements
- `🔊 Staff Voice`

#### 📋 Logs (Hidden from members)

- `#message-logs` - Message edit/delete logs
- `#mod-logs` - Moderation action logs
- `#member-logs` - Member join/leave logs
- `#server-logs` - Server event logs

## License

MIT License - Tanmay @ NeroX Studios
