from flask import Flask
from flask_cors import CORS
from config.db import get_database, close_mongo_connection
from routes.event_routes import events_bp
from routes.schedule_routes import schedule_bp
from routes.conflict_routes import conflicts_bp
from routes.admin_routes import admin_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(events_bp)
app.register_blueprint(schedule_bp)
app.register_blueprint(conflicts_bp)
app.register_blueprint(admin_bp)

# Initialize database connection on app start
@app.before_request
def initialize_db():
    """Initialize MongoDB connection before first request"""
    try:
        get_database()
    except Exception as e:
        print(f"Database initialization error: {e}")
        return {"error": "Database connection failed"}, 500


@app.teardown_appcontext
def shutdown_db(exception=None):
    """Close database connection on app shutdown"""
    close_mongo_connection()


@app.route("/")
def home():
    return {"status": "AcadSync AI backend running"}


@app.route("/health")
def health_check():
    """Health check endpoint that verifies database connection"""
    try:
        db = get_database()
        db.admin.command("ping")
        return {"status": "healthy", "database": "connected"}, 200
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}, 500


@app.route("/test-db")
def test_db():
    """Test MongoDB Atlas integration by inserting and fetching documents"""
    try:
        # Get database instance
        db = get_database()
        
        # Get the test collection
        test_collection = db["test"]
        
        # Insert a sample document
        sample_document = {"message": "Database connected successfully"}
        test_collection.insert_one(sample_document)
        
        # Fetch all documents from the test collection
        documents = list(test_collection.find({}))
        
        # Convert documents to JSON-serializable format (exclude _id)
        result = []
        for doc in documents:
            doc_dict = {key: value for key, value in doc.items() if key != "_id"}
            result.append(doc_dict)
        
        return {"success": True, "documents": result}, 200
        
    except Exception as e:
        return {"success": False, "error": str(e)}, 500


if __name__ == "__main__":
    app.run(debug=True)