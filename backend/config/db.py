import os
import ssl
import certifi
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB Atlas connection URI from environment variable
# SECURITY: No default value - fail fast if not configured
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError(
        "MONGODB_URI environment variable is not set. "
        "Please configure it in your .env file."
    )

# MongoDB client instance (created once at startup)
_mongo_client = None
_db = None


def connect_to_mongo():
    """
    Establish connection to MongoDB Atlas and return the database instance.

    Returns:
        Database: MongoDB database instance

    Raises:
        ConnectionFailure: If unable to connect to MongoDB Atlas
    """
    global _mongo_client, _db

    if _mongo_client is not None:
        return _db

    try:
        print("🔄 Attempting to connect to MongoDB Atlas...")
        # SECURITY: Don't log the URI as it may contain credentials
        print("📍 Connecting to configured MongoDB cluster...")
        
        # Try simplified connection without explicit TLS settings
        # Let PyMongo handle SSL/TLS automatically with SRV connection
        _mongo_client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=30000,  # 30 second timeout
            connectTimeoutMS=20000,  # 20 second connection timeout
            socketTimeoutMS=20000,  # 20 second socket timeout
            retryWrites=True,
            retryReads=True,
            maxPoolSize=10,
            minPoolSize=1,
            # Let PyMongo auto-configure TLS for mongodb+srv:// URIs
        )

        # Verify the connection by pinging the server
        print("🏓 Pinging MongoDB server...")
        _mongo_client.admin.command("ping")

        # Get the database (replace with your actual database name)
        _db = _mongo_client["acadsync"]

        print("✓ Successfully connected to MongoDB Atlas")
        return _db

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"✗ Failed to connect to MongoDB Atlas: {e}")
        print("\n⚠️  Troubleshooting tips:")
        print("1. Check your internet connection")
        print("2. Verify MongoDB Atlas IP whitelist includes your current IP")
        print("3. Confirm the MONGODB_URI in .env is correct")
        print("4. Check if a firewall/proxy is blocking port 27017")
        print("5. Ensure MongoDB Atlas cluster is running")
        raise


def get_database():
    """
    Get the MongoDB database instance.
    Establishes connection if not already connected.

    Returns:
        Database: MongoDB database instance
    """
    global _db

    if _db is None:
        connect_to_mongo()

    return _db


def close_mongo_connection():
    """
    Close the MongoDB connection gracefully.
    """
    global _mongo_client, _db

    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        _db = None
        print("✓ MongoDB connection closed")
