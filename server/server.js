
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Mock data ---
const SAMPLE_CODE = `// example.py
import hashlib

# TODO: replace password check
if password == "password":
    print("weak check")

# hashing
hashed = hashlib.md5(password.encode()).hexdigest()
if hashed == stored_hashed:
    print("ok")

# db query
query = f"SELECT * FROM users WHERE email = '{user_email}'"
execute(query)
`;

const PRS = [
  { id:'101', title:'Add user authentication', author:'alice', repo:'webapp', branch:'auth-feature', commits:5, updatedAgo:'2h', aiReviewed:true, files:['example.py'] },
  { id:'102', title:'Refactor API handler', author:'bob', repo:'webapp', branch:'refactor/handlers', commits:3, updatedAgo:'1d', aiReviewed:false, files:['api.js'] },
  { id:'103', title:'Fix login bug', author:'carol', repo:'webapp', branch:'bugfix/login', commits:2, updatedAgo:'4h', aiReviewed:true, files:['login.js'] },
];

const FILES = {
  "example.py": SAMPLE_CODE,
  "api.js": "// api.js\nexport async function handler(req, res){ /* ... */ }\n",
  "login.js": "// login.js\nfunction login(){ /* fix race */ }\n",
};

const ISSUES = [
  {
    id:'i1', file:'example.py', line:5,
    title:'Plaintext password comparison',
    description:'Use constant-time hash verification.',
    suggestion:'Use bcrypt.compare or hmac.compare_digest over hashed values.',
    category:'security', severity:'critical', confidence:0.92,
    patch:{ before:'if password == "password":', after:'import hmac\nif hmac.compare_digest(hash(password), stored_hash):' }
  },
  {
    id:'i2', file:'example.py', line:10, title:'MD5 used for hashing',
    description:'MD5 is insecure. Prefer bcrypt/Argon2 or SHA-256 + salt.',
    suggestion:'Switch to bcrypt with per-user salt.',
    category:'security', severity:'major', confidence:0.88,
    patch:{ before:'hashed = hashlib.md5(password.encode()).hexdigest()', after:'import bcrypt\nhashed = bcrypt.hashpw(password, bcrypt.gensalt())' }
  },
  {
    id:'i3', file:'example.py', line:15, title:'SQL query string interpolation',
    description:'Interpolating user input allows SQL injection.',
    suggestion:'Use parameterized query with placeholders.',
    category:'security', severity:'critical', confidence:0.95,
    patch:{ before:"query = f\"SELECT * FROM users WHERE email = '{user_email}'\"", after:"query = 'SELECT * FROM users WHERE email = ?'\nexecute(query, [user_email])" }
  },
  {
    id:'i4', file:'example.py', line:3, title:'TODO left in code',
    description:'Remove TODO or track via issue; leaves dead branches.',
    suggestion:'Replace with explicit function + tests.',
    category:'quality', severity:'minor', confidence:0.74,
  },
];

// --- API ---

// List PRs
app.get('/api/prs', (req, res) => {
  res.json(PRS);
});

// Files for a PR
app.get('/api/prs/:id/files', (req, res) => {
  const pr = PRS.find(p => p.id === req.params.id) || PRS[0];
  res.json(pr.files || []);
});

// Get file content
app.get('/api/file/:name', (req, res) => {
  const name = req.params.name;
  res.json({ name, code: FILES[name] || '' });
});

// Run AI review (simulate LangGraph)
app.post('/api/review/:id', async (req, res) => {
  const { id } = req.params;
  const pr = PRS.find(p => p.id === id) || PRS[0];
  await new Promise(r => setTimeout(r, 300));
  res.json({
    pr,
    issues: pr.files.includes('example.py') ? ISSUES : [],
    summary: `AI review completed for PR ${id}. Found ${pr.files.includes('example.py') ? ISSUES.length : 0} potential issues.`,
    model: "langgraph-demo-v0.2"
  });
});

// Accept a patch
app.post('/api/patch', async (req, res) => {
  const { prId, file, before, after } = req.body || {};
  if (!prId || !file || !before || !after) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }
  // naive apply to FILES (simulation)
  if (FILES[file]) {
    FILES[file] = FILES[file].replace(before, after);
  }
  await new Promise(r => setTimeout(r, 150));
  res.json({ ok: true, message: "Patch applied in simulation", prId, file });
});

// Chat with agent
app.post('/api/agent-chat', async (req, res) => {
  const { text } = req.body || {};
  await new Promise(r => setTimeout(r, 150));
  const reply = "I've analyzed the diff. Consider parameterized queries and avoid MD5 for password hashing.";
  res.json({ reply, echo: text || "" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mock LangGraph API server running http://localhost:${PORT}`);
});
