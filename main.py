import os
from load_env import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Import app after environment variables are loaded
from app import app

if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
