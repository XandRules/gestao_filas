const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const file = path.join(__dirname, 'user.json');
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

if (!Array.isArray(data.users)) {
  console.error('user.json inválido: campo "users" não é array');
  process.exit(1);
}

let changed = false;
const rounds = 10;

const users = data.users.map((u) => {
  if (typeof u.password === 'string') {
    const hash = bcrypt.hashSync(u.password, rounds);
    const { password, ...rest } = u;
    changed = true;
    return { ...rest, passwordHash: hash };
  }
  return u;
});

if (changed) {
  const out = { users };
  fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf-8');
  console.log('Usuarios atualizados com passwordHash (bcrypt).');
} else {
  console.log('Nenhuma senha em texto encontrada; nada a converter.');
}