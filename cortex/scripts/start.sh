#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
  echo 'Falta cortex/.env. Copia .env.example, configura OpenRouter y genera secretos únicos.' >&2
  exit 1
fi
docker compose up -d --build
python3 - <<'PY'
import subprocess,time,urllib.request
for attempt in range(90):
    try:
        urllib.request.urlopen('http://127.0.0.1:3082/api/config',timeout=3)
        break
    except Exception:
        if attempt==89: raise SystemExit('Cortex no ha arrancado; revisa docker compose logs chat')
        time.sleep(2)
result=subprocess.run(['docker','compose','exec','-T','chat','node','-e', '''
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('@librechat/data-schemas').createModels(mongoose);
(async () => {
 await mongoose.connect(process.env.MONGO_URI);
 const email = process.env.DEMO_EMAIL;
 if (!email || !process.env.DEMO_PASSWORD) throw new Error('Missing demo credentials');
 const existing = await User.findOne({email});
 if (existing) { console.log('Demo account already exists'); await mongoose.disconnect(); return; }
 await User.create({email, name: 'V2S Operations', username: 'v2s-demo', password: await bcrypt.hash(process.env.DEMO_PASSWORD, 12), emailVerified: true, provider: 'local', role: 'ADMIN'});
 console.log('Demo account created');
 await mongoose.disconnect();
})().catch(err => { console.error(err.message); process.exit(1); });
'''],check=True)
print('Cortex listo en http://localhost:3082 y http://100.119.129.71:3082. Credenciales: cortex/.env (DEMO_EMAIL y DEMO_PASSWORD).')
PY
