import mysql.connector
from config import Config


def get_connection():
    """Open a fresh MySQL connection. Simple per-request pattern -
    fine for a small app; switch to a connection pool if traffic grows."""
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT,
    )