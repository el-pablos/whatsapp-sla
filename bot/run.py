"""
Entry point untuk WhatsApp SLA Bot
"""
import os
import signal
import sys
import logging

# Tambahkan parent directory ke path agar bisa import bot module
# Ini memungkinkan run.py dijalankan langsung dengan `python bot/run.py`
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from dotenv import load_dotenv

# Load environment variables dari root project
env_path = os.path.join(parent_dir, '.env')
load_dotenv(env_path)

from bot.app import create_app
from bot.main import shutdown_executor

logger = logging.getLogger(__name__)

# Global app instance
app = create_app()


def graceful_shutdown(signum, frame):
    """
    Handle graceful shutdown on SIGINT/SIGTERM.
    """
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    shutdown_executor()
    sys.exit(0)


def main():
    """
    Main entry point untuk menjalankan bot.
    """
    # Register signal handlers
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)

    # Get config dari environment
    host = os.getenv("BOT_HOST", "0.0.0.0")
    port = int(os.getenv("BOT_PORT", "5000"))
    debug = os.getenv("APP_DEBUG", "false").lower() == "true"

    logger.info(f"Starting WhatsApp SLA Bot on {host}:{port}")
    logger.info(f"Debug mode: {debug}")

    try:
        # Run Flask app
        # Untuk production, gunakan gunicorn atau uwsgi
        app.run(
            host=host,
            port=port,
            debug=debug,
            use_reloader=debug,
            threaded=True
        )
    except Exception as e:
        logger.error(f"Failed to start bot: {e}")
        shutdown_executor()
        sys.exit(1)


if __name__ == "__main__":
    main()
