#!/usr/bin/env python3
"""
Startup script for debug_server.py on Render
This ensures proper environment setup and graceful startup
"""

import os
import sys
from debug_server import app

def main():
    """Main startup function"""
    print("🚀 Starting MedAI-VIGI (Debug Server Mode)")
    
    # Set production environment
    os.environ['PRODUCTION'] = 'true'
    os.environ['FLASK_ENV'] = 'production'
    
    # Get port from environment (Render sets this)
    port = int(os.getenv('PORT', 5000))
    
    print(f"🌐 Starting server on port {port}")
    print("💊 Health check available at: /health")
    print("🔍 Debug info available at: /debug")
    
    # Run the Flask app
    app.run(
        debug=False,
        host='0.0.0.0',
        port=port,
        threaded=True
    )

if __name__ == '__main__':
    main()