import base64
import hashlib
import hmac
import json
import os
import ssl
import sys
import time
import urllib.parse
from threading import Event

import paho.mqtt.client as mqtt


def getenv_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"missing env: {name}")
    return value


def build_token(product_id: str, device_name: str, access_key: str, expire_ts: int) -> str:
    version = "2018-10-31"
    method = "md5"
    resource = f"products/{product_id}/devices/{device_name}"
    msg = f"{expire_ts}\n{method}\n{resource}\n{version}".encode()
    key = base64.b64decode(access_key)
    sign = base64.b64encode(hmac.new(key, msg, hashlib.md5).digest()).decode()
    return (
        f"version={version}"
        f"&res={urllib.parse.quote(resource, safe='')}"
        f"&et={expire_ts}"
        f"&method={method}"
        f"&sign={urllib.parse.quote(sign, safe='')}"
    )


def main() -> int:
    product_id = getenv_required("ONENET_PRODUCT_ID")
    device_name = getenv_required("ONENET_DEVICE_NAME")
    access_key = getenv_required("ONENET_ACCESS_KEY")
    host = os.getenv("ONENET_HOST", f"{product_id}.mqttstls.acc.cmcconenet.cn")
    port = int(os.getenv("ONENET_PORT", "8883"))
    expire_ts = int(time.time()) + 3600
    password = build_token(product_id, device_name, access_key, expire_ts)
    reply_topic = f"$sys/{product_id}/{device_name}/thing/property/post/reply"
    pub_topic = f"$sys/{product_id}/{device_name}/thing/property/post"

    connected = Event()
    replies = []

    def on_connect(client, userdata, flags, reason_code, properties=None):
        print("CONNECT", reason_code)
        client.subscribe(reply_topic, qos=0)
        connected.set()

    def on_message(client, userdata, msg):
        text = msg.payload.decode()
        replies.append(text)
        print("REPLY", text)

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=device_name,
        protocol=mqtt.MQTTv311,
    )
    client.username_pw_set(product_id, password)
    client.tls_set(cert_reqs=ssl.CERT_NONE, tls_version=ssl.PROTOCOL_TLS_CLIENT)
    client.tls_insecure_set(True)
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(host, port, keepalive=120)
    client.loop_start()

    if not connected.wait(10):
        raise SystemExit("connect timeout")

    payloads = [
        {
            "id": str(int(time.time() * 1000)),
            "version": "1.0",
            "params": {
                "posture": {"value": {"pitch": 12.3, "roll": 1.1, "yaw": 32}},
                "CollectionEquipmentStatus": {"value": 0},
                "flame": {"value": False},
                "humidity": {"value": 45.6},
                "red": {"value": False},
                "smoke": {"value": True},
                "temperature": {"value": 26.8},
            },
        },
        {
            "id": str(int(time.time() * 1000) + 1),
            "version": "1.0",
            "params": {
                "posture": {"value": {"pitch": 88.8, "roll": 6.6, "yaw": 123}},
                "CollectionEquipmentStatus": {"value": 1},
                "flame": {"value": True},
                "humidity": {"value": 61.2},
                "red": {"value": True},
                "smoke": {"value": False},
                "temperature": {"value": 31.5},
            },
        },
    ]

    for payload in payloads:
        text = json.dumps(payload, separators=(",", ":"))
        print("PUBLISH", text)
        info = client.publish(pub_topic, text, qos=0)
        info.wait_for_publish(5)
        time.sleep(2)

    for _ in range(10):
        if len(replies) >= 2:
            break
        time.sleep(1)

    client.loop_stop()
    client.disconnect()
    print("REPLY_COUNT", len(replies))
    return 0 if len(replies) >= 2 else 1


if __name__ == "__main__":
    sys.exit(main())
