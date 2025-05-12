const express = require('express');
const nedb = require('nedb-promises');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const db = nedb.create('users.jsonl');

app.use(express.static('public'));
app.use(express.json());

const generateToken = () => crypto.randomBytes(16).toString('hex');

// Register user
app.post('/users', async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name || !email)
    return res.json({ error: 'Missing fields.' });

  const existing = await db.findOne({ username });
  if (existing) return res.json({ error: 'Username already exists.' });

  const hashed = bcrypt.hashSync(password, 10);
  const token = generateToken();

  const user = await db.insert({ username, password: hashed, name, email, authenticationToken: token });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// Authenticate user
app.post('/users/auth', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findOne({ username });
  if (!user) return res.json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.json({ error: 'Invalid credentials' });

  const token = generateToken();
  await db.update({ username }, { $set: { authenticationToken: token } });

  const updated = await db.findOne({ username });
  const { password: _, ...safeUser } = updated;
  res.json(safeUser);
});

// Get all users (without passwords or tokens)
app.get('/users', async (req, res) => {
  const users = await db.find({});
  const sanitized = users.map(({ username, name, email }) => ({ username, name, email }));
  res.json(sanitized);
});

// Update user (requires token)
app.patch('/users/:username/:token', async (req, res) => {
  const { username, token } = req.params;
  const { name, email } = req.body;
  const user = await db.findOne({ username });

  if (!user || user.authenticationToken !== token)
    return res.json({ error: 'Authentication failed.' });

  const count = await db.update({ username }, { $set: { name, email } });
  if (count === 0) return res.json({ error: 'Update failed.' });
  res.json({ ok: true });
});

// Delete user (requires token)
app.delete('/users/:username/:token', async (req, res) => {
  const { username, token } = req.params;
  const user = await db.findOne({ username });

  if (!user || user.authenticationToken !== token)
    return res.json({ error: 'Authentication failed.' });

  const count = await db.delete({ username });
  if (count === 0) return res.json({ error: 'Deletion failed.' });
  res.json({ ok: true });
});

// Logout (clears token)
app.post('/users/logout', async (req, res) => {
  const { username } = req.body;
  await db.update({ username }, { $unset: { authenticationToken: true } });
  res.json({ ok: true });
});

app.all('*', (req, res) => res.status(404).send('Invalid URL.'));
app.listen(3000, () => console.log('✅ Secure server at http://localhost:3000'));
