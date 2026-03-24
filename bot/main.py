"""
Main Bot Module - Webhook receiver dan message handler untuk WhatsApp SLA Bot
"""
import logging
import hashlib
import hmac
from concurrent.futures import ThreadPoolExecutor
from flask import Blueprint, request, current_app, jsonify

logger = logging.getLogger(__name__)

# Blueprint untuk webhook routes
webhook_bp = Blueprint("webhook", __name__)

# Thread pool untuk async processing
executor = ThreadPoolExecutor(max_workers=4)


def verify_webhook_signature(payload, signature):
    """
    Verifikasi signature dari WhatsApp webhook.

    Args:
        payload: Raw request body
        signature: X-Hub-Signature-256 header

    Returns:
        bool: True jika valid
    """
    if not signature:
        return False

    app_secret = current_app.config.get("WA_APP_SECRET", "")
    if not app_secret:
        logger.warning("WA_APP_SECRET tidak dikonfigurasi")
        return True  # Skip verification jika secret tidak ada

    expected = hmac.new(
        app_secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()

    provided = signature.replace("sha256=", "")
    return hmac.compare_digest(expected, provided)


def parse_webhook_payload(data):
    """
    Parse incoming webhook payload dari WhatsApp.

    Args:
        data: JSON payload dari webhook

    Returns:
        list: List of parsed messages
    """
    messages = []

    if not data or "entry" not in data:
        return messages

    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})

            # Extract messages
            for message in value.get("messages", []):
                parsed = {
                    "message_id": message.get("id"),
                    "from": message.get("from"),
                    "timestamp": message.get("timestamp"),
                    "type": message.get("type"),
                    "text": None,
                    "media": None,
                }

                # Handle different message types
                if message.get("type") == "text":
                    parsed["text"] = message.get("text", {}).get("body")
                elif message.get("type") in ["image", "video", "audio", "document"]:
                    parsed["media"] = message.get(message.get("type"))
                elif message.get("type") == "interactive":
                    interactive = message.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        parsed["text"] = interactive.get("button_reply", {}).get("id")
                    elif interactive.get("type") == "list_reply":
                        parsed["text"] = interactive.get("list_reply", {}).get("id")

                # Extract contact info
                contacts = value.get("contacts", [])
                if contacts:
                    parsed["contact_name"] = contacts[0].get("profile", {}).get("name")

                messages.append(parsed)

            # Handle status updates
            for status in value.get("statuses", []):
                messages.append({
                    "type": "status",
                    "message_id": status.get("id"),
                    "status": status.get("status"),
                    "timestamp": status.get("timestamp"),
                    "recipient_id": status.get("recipient_id"),
                })

    return messages


def process_message_async(message):
    """
    Process message secara async di background thread.

    Args:
        message: Parsed message dict
    """
    try:
        logger.info(f"Processing message: {message.get('message_id')}")

        # Route ke handler berdasarkan type
        msg_type = message.get("type")

        if msg_type == "status":
            handle_status_update(message)
        elif msg_type == "text":
            handle_text_message(message)
        elif msg_type in ["image", "video", "audio", "document"]:
            handle_media_message(message)
        else:
            logger.warning(f"Unknown message type: {msg_type}")

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)


def handle_text_message(message):
    """
    Handle incoming text message.

    Args:
        message: Parsed message dict
    """
    sender = message.get("from")
    text = message.get("text", "")

    logger.info(f"Text message from {sender}: {text[:50]}...")

    # TODO: Implement business logic
    # - Check SLA status
    # - Route ke handler spesifik
    # - Generate response


def handle_media_message(message):
    """
    Handle incoming media message.

    Args:
        message: Parsed message dict
    """
    sender = message.get("from")
    media_type = message.get("type")

    logger.info(f"Media message ({media_type}) from {sender}")

    # TODO: Implement media handling
    # - Download media
    # - Process based on type


def handle_status_update(message):
    """
    Handle message status update (sent, delivered, read).

    Args:
        message: Parsed status dict
    """
    status = message.get("status")
    msg_id = message.get("message_id")

    logger.debug(f"Status update: {msg_id} -> {status}")

    # TODO: Update message status di database


@webhook_bp.route("/webhook", methods=["GET"])
def verify_webhook():
    """
    Webhook verification endpoint untuk WhatsApp.
    GET request dari Meta untuk verify webhook URL.
    """
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    verify_token = current_app.config.get("WA_VERIFY_TOKEN")

    if mode == "subscribe" and token == verify_token:
        logger.info("Webhook verified successfully")
        return challenge, 200

    logger.warning(f"Webhook verification failed. Mode: {mode}")
    return "Forbidden", 403


@webhook_bp.route("/webhook", methods=["POST"])
def receive_webhook():
    """
    Webhook receiver endpoint untuk incoming messages.
    POST request dari WhatsApp dengan message data.
    """
    # Verify signature
    signature = request.headers.get("X-Hub-Signature-256")
    if not verify_webhook_signature(request.data, signature):
        logger.warning("Invalid webhook signature")
        return "Unauthorized", 401

    # Parse payload
    try:
        data = request.get_json()
    except Exception as e:
        logger.error(f"Failed to parse JSON: {e}")
        return "Bad Request", 400

    # Log incoming webhook
    logger.debug(f"Received webhook: {data}")

    # Parse messages
    messages = parse_webhook_payload(data)

    # Process messages async
    for message in messages:
        executor.submit(process_message_async, message)

    # Always return 200 to acknowledge receipt
    return "OK", 200


def shutdown_executor():
    """
    Gracefully shutdown thread pool executor.
    Called on app shutdown.
    """
    logger.info("Shutting down executor...")
    executor.shutdown(wait=True, cancel_futures=False)
    logger.info("Executor shutdown complete")
