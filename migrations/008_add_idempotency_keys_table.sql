CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    request_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the request body to prevent key-tampering
    
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING'
        CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
        
    response_code INT,
    response_body JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_idempotency_expiration 
ON idempotency_keys(expires_at) 
WHERE status != 'PROCESSING';
