"""
WhatsApp Cloud API Client
"""
import requests
from typing import Optional

from .config import Config


class WhatsAppClient:
    """Client untuk WhatsApp Cloud API"""

    def __init__(self):
        Config.validate()
        self.api_url = Config.get_api_endpoint()
        self.headers = Config.get_headers()

    def _send_request(self, payload: dict) -> dict:
        """Send request ke WhatsApp API"""
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def send_text(self, phone: str, message: str) -> dict:
        """
        Kirim text message

        Args:
            phone: Nomor telepon dengan country code (contoh: 628123456789)
            message: Text message yang akan dikirim

        Returns:
            Response dari WhatsApp API
        """
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message
            }
        }
        return self._send_request(payload)

    def send_image(self, phone: str, image_url: str, caption: Optional[str] = None) -> dict:
        """
        Kirim image message

        Args:
            phone: Nomor telepon dengan country code
            image_url: URL gambar yang akan dikirim
            caption: Caption untuk gambar (optional)

        Returns:
            Response dari WhatsApp API
        """
        image_data = {"link": image_url}
        if caption:
            image_data["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "image",
            "image": image_data
        }
        return self._send_request(payload)

    def send_buttons(self, phone: str, body: str, buttons: list) -> dict:
        """
        Kirim interactive button message

        Args:
            phone: Nomor telepon dengan country code
            body: Body text message
            buttons: List of button dicts dengan format:
                     [{"id": "btn_1", "title": "Button 1"}, ...]
                     Max 3 buttons

        Returns:
            Response dari WhatsApp API
        """
        button_list = []
        for btn in buttons[:3]:
            button_list.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", ""),
                    "title": btn.get("title", "")[:20]
                }
            })

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {
                    "text": body
                },
                "action": {
                    "buttons": button_list
                }
            }
        }
        return self._send_request(payload)

    def send_list(self, phone: str, body: str, sections: list, button_text: str = "Menu") -> dict:
        """
        Kirim interactive list message

        Args:
            phone: Nomor telepon dengan country code
            body: Body text message
            sections: List of section dicts dengan format:
                      [{"title": "Section 1", "rows": [{"id": "row_1", "title": "Row 1", "description": "Desc"}]}]
            button_text: Text untuk button yang membuka list

        Returns:
            Response dari WhatsApp API
        """
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {
                    "text": body
                },
                "action": {
                    "button": button_text[:20],
                    "sections": sections
                }
            }
        }
        return self._send_request(payload)

    def mark_as_read(self, message_id: str) -> dict:
        """
        Mark message as read

        Args:
            message_id: ID dari message yang akan di-mark as read

        Returns:
            Response dari WhatsApp API
        """
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        return self._send_request(payload)

    def send_template(self, phone: str, template_name: str = "hello_world", language_code: str = "en_US", components: list = None) -> dict:
        """
        Kirim template message (WAJIB untuk memulai conversation di sandbox mode)

        Args:
            phone: Nomor telepon dengan country code (contoh: 6282210819939)
            template_name: Nama template yang sudah di-approve (default: hello_world)
            language_code: Kode bahasa template (default: en_US)
            components: Optional template components untuk dynamic content

        Returns:
            Response dari WhatsApp API
        """
        template_data = {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }

        if components:
            template_data["components"] = components

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": template_data
        }
        return self._send_request(payload)
