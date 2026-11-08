import mysql.connector
from mysql.connector import pooling
from config import Config

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="fintrack",
            pool_size=5,
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            port=Config.DB_PORT,
            ssl_disabled=False,
            connection_timeout=10,
        )
    return _pool


def get_connection():
    conn = _get_pool().get_connection()
    try:
        conn.ping(reconnect=True, attempts=2, delay=0)
    except mysql.connector.Error:
        pass
    return conn
