import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SESSION_SECRET', 'dar-el-hayah-secret-key')
    
    # Get the database URL from environment and handle special PostgreSQL URL format
    DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_1zGlhtmSi9Ae@ep-solitary-waterfall-a5lysrim-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require')
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 300,
        "pool_pre_ping": True
    }
