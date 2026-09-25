# ============================
# Flujo de Git — PY1 Comercio Electrónico
# main <- dev <- feature/*
# ============================

# --- Trabajar en tu feature para subir una rama bien---
git checkout feature/initial          # Te movés a tu rama
git status                            # Ver qué cambiaste (opcional)
git add .                             # Agregar todos los cambios
git commit -m "mensaje descriptivo"   # Guardar el commit
git push                              # Subir a GitHub


# --- Traer cambios nuevos de dev ---
git checkout dev
git pull
git checkout feature/initial
git merge dev


# --- Cuando tu feature está lista: llevarla a dev ---
# Opción recomendada: Pull Request en GitHub (feature/initial -> dev)
git push

# Opción rápida por terminal (sin PR):
git checkout dev
git pull
git merge feature/initial
git push


# --- Empezar una feature nueva (siempre desde dev actualizada) ---
git checkout dev
git pull
git checkout -b feature/nombre-nuevo


# --- Comandos de consulta rápida ---
git branch          # Ver en qué rama estás
git log --oneline   # Ver historial de commits
git diff             # Ver qué cambió antes de hacer add


# --- Deploy a GitHub Pages --- 
# Importante solo hacerlo las personas que estan completamente segura que es funcional
npm run deploy

# Link de git hub pages
https://1paul2.github.io/PY2---Comercio-Electronico/
