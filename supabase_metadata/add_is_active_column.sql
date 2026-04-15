-- Adicionar coluna is_active na tabela journeys
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Comentário para documentação
COMMENT ON COLUMN journeys.is_active IS 'Define se o curso está disponível (true) ou se aparecerá como Em Breve (false)';
