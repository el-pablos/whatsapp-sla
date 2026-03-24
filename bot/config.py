"""
WhatsApp API Configuration
Load dari environment variables
"""
import os


class Config:
    """Configuration class untuk WhatsApp API"""

    WHATSAPP_API_URL = os.getenv("WA_API_URL", "https://graph.facebook.com/v18.0")
    WHATSAPP_PHONE_NUMBER_ID = os.getenv("WA_PHONE_NUMBER_ID", "")
    WHATSAPP_ACCESS_TOKEN = os.getenv("WA_ACCESS_TOKEN", "")
    WHATSAPP_VERIFY_TOKEN = os.getenv("WA_VERIFY_TOKEN", "")

    @classmethod
    def get_api_endpoint(cls):
        """Get full API endpoint untuk send message"""
        return f"{cls.WHATSAPP_API_URL}/{cls.WHATSAPP_PHONE_NUMBER_ID}/messages"

    @classmethod
    def get_headers(cls):
        """Get headers untuk API request"""
        return {
            "Authorization": f"Bearer {cls.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

    @classmethod
    def validate(cls):
        """Validate required config"""
        required = [
            ("WHATSAPP_PHONE_NUMBER_ID", cls.WHATSAPP_PHONE_NUMBER_ID),
            ("WHATSAPP_ACCESS_TOKEN", cls.WHATSAPP_ACCESS_TOKEN),
        ]
        missing = [name for name, value in required if not value]
        if missing:
            raise ValueError(f"Missing required config: {', '.join(missing)}")
