-- Criar tabela de estado da app
CREATE TABLE IF NOT EXISTS app_state (
  id INT PRIMARY KEY DEFAULT 1,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de ledger (journal de eventos)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  meta JSONB,
  privacy TEXT,
  encrypted BOOLEAN DEFAULT false,
  payload JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de usuários (para autenticação futura)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_privacy ON ledger_entries(privacy);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(createdAt DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies de segurança (permite tudo por enquanto, depois restriciona)
CREATE POLICY "Allow all on app_state" ON app_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on ledger_entries" ON ledger_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
