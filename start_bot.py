#!/usr/bin/env python3
"""
Quick start script untuk WhatsApp SLA Bot.
Jalankan dari root directory: python start_bot.py
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Run the bot
from bot.run import main

if __name__ == "__main__":
    main()
