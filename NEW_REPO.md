# Push this project to a new repository

All local changes are committed. Follow these steps to put this project in a new Git repo.

## 1. Create the new repository

- **GitHub**: Go to [github.com/new](https://github.com/new).
- Choose a name (e.g. `hira-ai-app-capacitor`).
- Create the repo **empty** (do not add README, .gitignore, or license).
- Copy the repo URL (HTTPS), e.g. `https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git`.

## 2. Point this project at the new repo and push

In a terminal, from this folder:

```powershell
cd c:\Users\saisa\Desktop\hira-ai-app-capacitor

# Replace with your new repo URL:
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git push -u origin master
```

**If you want to keep the old repo as a backup remote instead of replacing origin:**

```powershell
git remote rename origin old-origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git push -u origin master
```

After pushing, the project lives in the new repo. Use your GitHub username and new repo name in the URL.
