"""
Flask App Factory untuk WhatsApp SLA Bot
"""
import os
import logging
from flask import Flask


def create_app(config_name=None):
    """
    Factory function untuk membuat Flask app instance.

    Args:
        config_name: Nama konfigurasi (development, production, testing)

    Returns:
        Flask app instance
    """
    app = Flask(__name__)

    # Load config dari environment
    app.config.update(
        SECRET_KEY=os.getenv("APP_KEY", "dev-secret-key"),
        DEBUG=os.getenv("APP_DEBUG", "false").lower() == "true",
        WA_VERIFY_TOKEN=os.getenv("WA_VERIFY_TOKEN", ""),
        WA_ACCESS_TOKEN=os.getenv("WA_ACCESS_TOKEN", ""),
        WA_PHONE_NUMBER_ID=os.getenv("WA_PHONE_NUMBER_ID", ""),
        WA_API_URL=os.getenv("WA_API_URL", "https://graph.facebook.com/v18.0"),
        WA_APP_SECRET=os.getenv("WA_APP_SECRET", ""),
    )

    # Setup logging
    log_level = logging.DEBUG if app.config["DEBUG"] else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Register blueprints
    from bot.main import webhook_bp
    app.register_blueprint(webhook_bp)

    # Health check route
    @app.route("/health")
    def health():
        return {"status": "healthy", "version": "1.0.0"}

    return app
