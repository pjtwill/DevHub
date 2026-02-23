<div align="center">

# 🛠️ DevHub

**Your GitHub projects, all in one place.**

A dark, minimalist desktop-style app to manage your GitHub repositories — view status, handle branches, issues, PRs, and READMEs without ever leaving the app.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![GitHub API](https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

---
## Prints
<img width="1568" height="751" alt="progithub1" src="https://github.com/user-attachments/assets/e76ae7ed-0f0f-4d96-b580-3787fd44e803">

<img width="1568" height="751" alt="progithub2" src="https://github.com/user-attachments/assets/aa7bb73e-869d-4ab3-845e-5db09adef9da">

<img width="1568" height="751" alt="progithub3" src="https://github.com/user-attachments/assets/06c481b9-a3f7-4d6a-85ab-c99bb73eea76">

<img width="1568" height="751" alt="progithub4" src="https://github.com/user-attachments/assets/724b43a7-ca9e-4159-b0bb-8cdd358c1d2c">
---

## ✨ Features

- 📊 **Dashboard** — stats overview, commit heatmap, and recent activity feed
- 📁 **Project Manager** — all your repos in one grid with real-time sync status
- 🔀 **Branches** — view, create, and delete branches directly in the app
- 🐛 **Issues** — open, close, and create issues without leaving DevHub
- 🔁 **Pull Requests** — review and merge PRs with one click
- 📝 **README Editor** — view and edit READMEs with markdown rendering
- ⭐ **Starred Repos** — track your starred repositories and their updates
- 🔔 **Notifications** — real-time GitHub notifications with mark-as-read
- 📈 **Stats Page** — language breakdown, commit frequency, and repo growth charts
- ⌨️ **Keyboard Shortcuts** — Cmd+K palette, Cmd+N new repo, and more

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pjtwill/DevHub.git
cd DevHub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app

```bash
npm run dev
```

### 4. Connect your GitHub

- Go to **Settings** inside the app
- Generate a [Personal Access Token](https://github.com/settings/tokens) (classic) with scopes: `repo`, `read:user`, `delete_repo`, `read:org`
- Paste the token and click **Save Token**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + N` | New repository |
| `Cmd/Ctrl + R` | Refresh data |
| `G then D` | Go to Dashboard |
| `G then P` | Go to Projects |
| `G then H` | Go to GitHub |
| `G then S` | Go to Settings |
| `Escape` | Close modal / panel |
| `?` | Show all shortcuts |

---

## 🔒 Security Note

Your GitHub token is stored locally in your browser's `localStorage` and is never sent to any external server other than the GitHub API directly. Do not share your app session with others while a token is active.

---

## 🛣️ Roadmap

- [ ] Tauri integration for native desktop experience
- [ ] Open projects directly in VS Code
- [ ] Real `git status` via local file system
- [ ] Desktop notifications for new PRs and issues
- [ ] Multi-account GitHub support

---

## 📄 License

MIT © [pjtwill](https://github.com/pjtwill) — **DevHub**
