-- REM initial schema

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(320) UNIQUE NOT NULL,
  api_key_hash VARCHAR(256),
  api_key_prefix VARCHAR(12),
  plan VARCHAR(50) DEFAULT 'free',
  total_agents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS agents (
  agent_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  total_episodes INTEGER DEFAULT 0,
  total_semantic_memories INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS episodes (
  episode_id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36) NOT NULL REFERENCES agents(agent_id),
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) DEFAULT '',
  team_id VARCHAR(36) DEFAULT '',
  raw_content TEXT NOT NULL,
  parsed_entities JSONB DEFAULT '[]'::jsonb,
  intent VARCHAR(500) DEFAULT '',
  outcome VARCHAR(50) DEFAULT 'unknown',
  domain VARCHAR(100) DEFAULT 'general',
  emotion_signal VARCHAR(50) DEFAULT '',
  importance_score FLOAT DEFAULT 0.5,
  retrieval_count INTEGER DEFAULT 0,
  last_retrieved_at TIMESTAMPTZ,
  consolidated BOOLEAN DEFAULT FALSE,
  consolidation_candidate BOOLEAN DEFAULT FALSE,
  consolidated_into VARCHAR(36) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS semantic_memories (
  semantic_id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36) NOT NULL REFERENCES agents(agent_id),
  user_id VARCHAR(36) DEFAULT '',
  fact TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.7,
  evidence_count INTEGER DEFAULT 1,
  source_episode_ids JSONB DEFAULT '[]'::jsonb,
  domain VARCHAR(100) DEFAULT 'general',
  fact_type VARCHAR(50) DEFAULT 'pattern',
  active BOOLEAN DEFAULT TRUE,
  contradicted_by VARCHAR(36) DEFAULT '',
  superseded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_retrieved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);

CREATE INDEX IF NOT EXISTS idx_episodes_agent_id ON episodes(agent_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_consolidated ON episodes(consolidated);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at_desc ON episodes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_semantic_agent_id ON semantic_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_semantic_active ON semantic_memories(active);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_episodes_set_updated_at ON episodes;
CREATE TRIGGER trg_episodes_set_updated_at
BEFORE UPDATE ON episodes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_semantic_set_updated_at ON semantic_memories;
CREATE TRIGGER trg_semantic_set_updated_at
BEFORE UPDATE ON semantic_memories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 1. schema_migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    api_key_hash VARCHAR(256),
    api_key_prefix VARCHAR(12),
    plan VARCHAR(50) DEFAULT 'free',
    total_agents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- 3. agents
CREATE TABLE IF NOT EXISTS agents (
    agent_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    total_episodes INTEGER DEFAULT 0,
    total_semantic_memories INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- 4. episodes
CREATE TABLE IF NOT EXISTS episodes (
    episode_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL REFERENCES agents(agent_id),
    user_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) DEFAULT '',
    team_id VARCHAR(36) DEFAULT '',
    raw_content TEXT NOT NULL,
    parsed_entities JSONB DEFAULT '[]'::jsonb,
    intent VARCHAR(500) DEFAULT '',
    outcome VARCHAR(50) DEFAULT 'unknown',
    domain VARCHAR(100) DEFAULT 'general',
    emotion_signal VARCHAR(50) DEFAULT '',
    importance_score FLOAT DEFAULT 0.5,
    retrieval_count INTEGER DEFAULT 0,
    last_retrieved_at TIMESTAMPTZ,
    consolidated BOOLEAN DEFAULT FALSE,
    consolidation_candidate BOOLEAN DEFAULT FALSE,
    consolidated_into VARCHAR(36) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. semantic_memories
CREATE TABLE IF NOT EXISTS semantic_memories (
    semantic_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL REFERENCES agents(agent_id),
    user_id VARCHAR(36) DEFAULT '',
    fact TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.7,
    evidence_count INTEGER DEFAULT 1,
    source_episode_ids JSONB DEFAULT '[]'::jsonb,
    domain VARCHAR(100) DEFAULT 'general',
    fact_type VARCHAR(50) DEFAULT 'pattern',
    active BOOLEAN DEFAULT TRUE,
    contradicted_by VARCHAR(36) DEFAULT '',
    superseded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_retrieved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_episodes_agent_id ON episodes(agent_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_consolidated ON episodes(consolidated);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at_desc ON episodes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_semantic_memories_agent_id ON semantic_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_semantic_memories_active ON semantic_memories(active);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_episodes_set_updated_at
BEFORE UPDATE ON episodes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_semantic_memories_set_updated_at
BEFORE UPDATE ON semantic_memories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

