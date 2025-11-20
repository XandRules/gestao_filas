const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const server = jsonServer.create();
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public'),
});

function readJson(file) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) return {};
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

// Agregar múltiplos arquivos de dados
const db = {
  // dados do monitor permanecem em db.json
  ...readJson('db.json'),
  // dados por funcionalidade
  ...readJson('user.json'),
  ...readJson('paciente.json'),
  ...readJson('fila.json'),
};

const router = jsonServer.router(db);

// Reescritas de rotas amigáveis
server.use(jsonServer.rewriter({
  '/monitor/current': '/monitorCurrent/1',
  '/monitor/history': '/monitorHistory',
}));

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Hash automático ao criar/atualizar usuários
server.post('/users', (req, res, next) => {
  if (typeof req.body?.password === 'string') {
    req.body.passwordHash = bcrypt.hashSync(req.body.password, 10);
    delete req.body.password;
  }
  next();
});
server.put('/users/:id', (req, res, next) => {
  if (typeof req.body?.password === 'string') {
    req.body.passwordHash = bcrypt.hashSync(req.body.password, 10);
    delete req.body.password;
  }
  next();
});
server.patch('/users/:id', (req, res, next) => {
  if (typeof req.body?.password === 'string') {
    req.body.passwordHash = bcrypt.hashSync(req.body.password, 10);
    delete req.body.password;
  }
  next();
});

// Endpoint de login com bcrypt
server.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = router.db.get('users').find({ username }).value();
  if (user && typeof user.passwordHash === 'string') {
    const ok = bcrypt.compareSync(password || '', user.passwordHash);
    if (ok) {
      const { passwordHash, ...safe } = user;
      return res.json({ ok: true, user: safe });
    }
  }
  return res.status(401).json({ ok: false, message: 'Credenciais inválidas' });
});

server.use(router);

const PORT = process.env.PORT || 4303;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});