"""
Notifier module untuk publish/subscribe events via Redis.
"""
import os
import json
from typing import Any, Callable, Optional
import redis


class Notifier:
    """
    Notifier class untuk mengirim notifikasi via Redis pub/sub.

    Channels:
    - orders: notifikasi order baru
    - chats: notifikasi handover request
    - messages: notifikasi pesan baru
    - admin_response: response dari admin
    """

    CHANNEL_ORDERS = "orders"
    CHANNEL_CHATS = "chats"
    CHANNEL_MESSAGES = "messages"
    CHANNEL_ADMIN_RESPONSE = "admin_response"

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        password: Optional[str] = None,
        username: Optional[str] = None,
        db: int = 0
    ):
        """
        Initialize Redis connection.

        Args:
            host: Redis host (default dari env REDIS_HOST)
            port: Redis port (default dari env REDIS_PORT)
            password: Redis password (default dari env REDIS_PASSWORD)
            username: Redis username (default dari env REDIS_USERNAME)
            db: Redis database number
        """
        self.host = host or os.getenv(
            "REDIS_HOST",
            "redis-11343.c334.asia-southeast2-1.gce.cloud.redislabs.com"
        )
        self.port = int(port or os.getenv("REDIS_PORT", 11343))
        self.password = password or os.getenv("REDIS_PASSWORD")
        self.username = username or os.getenv("REDIS_USERNAME", "default")
        self.db = db

        self._client: Optional[redis.Redis] = None
        self._pubsub: Optional[redis.client.PubSub] = None

    @property
    def client(self) -> redis.Redis:
        """Lazy initialization Redis client."""
        if self._client is None:
            self._client = redis.Redis(
                host=self.host,
                port=self.port,
                password=self.password,
                username=self.username,
                db=self.db,
                decode_responses=True
            )
        return self._client

    def _publish(self, channel: str, data: Any) -> int:
        """
        Publish data ke channel.

        Args:
            channel: nama channel
            data: data yang akan di-publish (akan di-serialize ke JSON)

        Returns:
            Jumlah subscriber yang menerima message
        """
        message = json.dumps(data, ensure_ascii=False, default=str)
        return self.client.publish(channel, message)

    def notify_new_order(self, order_data: dict) -> int:
        """
        Notify order baru ke channel orders.

        Args:
            order_data: data order (dict)

        Returns:
            Jumlah subscriber yang menerima
        """
        return self._publish(self.CHANNEL_ORDERS, order_data)

    def notify_handover_request(self, chat_data: dict) -> int:
        """
        Notify handover request ke channel chats.

        Args:
            chat_data: data chat untuk handover (dict)

        Returns:
            Jumlah subscriber yang menerima
        """
        return self._publish(self.CHANNEL_CHATS, chat_data)

    def notify_new_message(self, message_data: dict) -> int:
        """
        Notify pesan baru ke channel messages.

        Args:
            message_data: data message (dict)

        Returns:
            Jumlah subscriber yang menerima
        """
        return self._publish(self.CHANNEL_MESSAGES, message_data)

    def subscribe_admin_response(
        self,
        callback: Optional[Callable[[dict], None]] = None,
        timeout: Optional[int] = None
    ):
        """
        Subscribe ke channel admin_response untuk listen response dari admin.

        Args:
            callback: function yang dipanggil saat ada message baru.
                      Jika None, akan yield messages sebagai generator.
            timeout: timeout dalam detik untuk setiap listen iteration.
                     Jika None, akan blocking indefinitely.

        Yields:
            dict: parsed message data jika callback tidak di-provide
        """
        if self._pubsub is None:
            self._pubsub = self.client.pubsub()

        self._pubsub.subscribe(self.CHANNEL_ADMIN_RESPONSE)

        try:
            for message in self._pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])

                    if callback:
                        callback(data)
                    else:
                        yield data
        except KeyboardInterrupt:
            pass
        finally:
            self._pubsub.unsubscribe(self.CHANNEL_ADMIN_RESPONSE)

    def close(self):
        """Close Redis connections."""
        if self._pubsub:
            self._pubsub.close()
            self._pubsub = None
        if self._client:
            self._client.close()
            self._client = None

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
        return False


# Singleton instance untuk kemudahan penggunaan
_default_notifier: Optional[Notifier] = None


def get_notifier() -> Notifier:
    """Get atau create default notifier instance."""
    global _default_notifier
    if _default_notifier is None:
        _default_notifier = Notifier()
    return _default_notifier
