"""
Simple script to load environment variables from .env file
"""
import os
import re

def load_dotenv(dotenv_path=".env"):
    """
    Load environment variables from .env file
    """
    if not os.path.exists(dotenv_path):
        return
    
    with open(dotenv_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith("#"):
                continue
                
            # Parse key-value pairs
            match = re.match(r'^([A-Za-z0-9_]+)=(.*)$', line)
            if match:
                key, value = match.groups()
                # Remove quotes if present
                value = value.strip("'\"")
                # Set environment variable
                os.environ[key] = value

if __name__ == "__main__":
    load_dotenv()
    print("Environment variables loaded from .env file")