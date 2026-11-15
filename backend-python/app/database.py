import os
from pathlib import Path
from contextlib import contextmanager
import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
from dotenv import load_dotenv

# Resolve .env path reliably relative to this file
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 35433))
DB_NAME = os.getenv("DB_NAME", "openproject")
DB_USER = os.getenv("DB_USER", "openproject")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Connection pool for high performance and low latency
pool = ThreadedConnectionPool(
    minconn=1,
    maxconn=15,
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    connect_timeout=10,
    cursor_factory=psycopg2.extras.RealDictCursor,
)

@contextmanager
def get_db():
    """Acquires a connection from pool and ensures return after execution."""
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)

def get_connection():
    """Fallback direct connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
