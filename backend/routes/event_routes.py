from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from config.db import get_database
from routes.conflict_service import check_event_conflict

events_bp = Blueprint('events', __name__, url_prefix='/events')


def validate_event_data(data):
    """
    Validate event data.

    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['title', 'organizer', 'date', 'start_time', 'end_time', 'location']

    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"

    # Validate status values if provided
    if 'status' in data:
        valid_statuses = ['scheduled', 'ongoing', 'completed', 'cancelled', 'pending', 'conflict', 'approved', 'rejected']
        if data['status'] not in valid_statuses:
            return False, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"

    # Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD"

    # Validate time format (HH:MM)
    try:
        datetime.strptime(data['start_time'], '%H:%M')
        datetime.strptime(data['end_time'], '%H:%M')
    except ValueError:
        return False, "Invalid time format. Use HH:MM"

    return True, None


@events_bp.route('', methods=['POST'])
def create_event():
    """
    Create a new event.

    Request body:
    {
        "title": "Event Name",
        "organizer": "Organizer Name",
        "date": "2026-03-15",
        "start_time": "10:00",
        "end_time": "12:00",
        "location": "Event Location"
    }

    Returns:
        - 201 (Created): Event successfully created with status "pending"
        - 400 (Bad Request): Invalid or missing data
        - 500 (Internal Server Error): Server error
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is empty"}), 400

        # Validate event data
        is_valid, error_message = validate_event_data(data)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        # Get MongoDB database and collection
        db = get_database()
        events_collection = db.events

        # Prepare event data with default status
        event_data = {
            "title": data['title'],
            "organizer": data['organizer'],
            "date": data['date'],
            "start_time": data['start_time'],
            "end_time": data['end_time'],
            "location": data['location'],
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert event into database
        result = events_collection.insert_one(event_data)

        # Prepare response (exclude _id from MongoDB)
        response_data = {
            "title": event_data['title'],
            "organizer": event_data['organizer'],
            "date": event_data['date'],
            "start_time": event_data['start_time'],
            "end_time": event_data['end_time'],
            "location": event_data['location'],
            "status": event_data['status'],
            "id": str(result.inserted_id)
        }

        return jsonify(response_data), 201

    except Exception as e:
        return jsonify({"error": f"Failed to create event: {str(e)}"}), 500


@events_bp.route('', methods=['GET'])
def get_events():
    """
    Get all events with optional filtering.

    Query parameters:
        - status: Filter by status (scheduled, ongoing, completed, cancelled)
        - club: Filter by club name
        - date: Filter by date (YYYY-MM-DD)

    Returns:
        JSON array of events
    """
    try:
        db = get_database()
        events_collection = db.events

        # Build filter based on query parameters
        filter_query = {}

        status = request.args.get('status')
        if status:
            filter_query['status'] = status

        club = request.args.get('club')
        if club:
            filter_query['club'] = club

        date = request.args.get('date')
        if date:
            filter_query['date'] = date

        # Fetch events from database, sorted by date and start_time
        events = list(events_collection.find(filter_query).sort([
            ('date', 1),
            ('start_time', 1)
        ]))

        # Convert ObjectId to string for JSON serialization
        for event in events:
            event['_id'] = str(event['_id'])
            # Handle datetime serialization
            if 'created_at' in event:
                event['created_at'] = event['created_at'].isoformat()
            if 'updated_at' in event:
                event['updated_at'] = event['updated_at'].isoformat()

        return jsonify({
            "count": len(events),
            "events": events
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch events: {str(e)}"}), 500


@events_bp.route('/<event_id>', methods=['GET'])
def get_event(event_id):
    """
    Get a specific event by ID.

    URL parameters:
        - event_id: MongoDB ObjectId of the event

    Returns:
        JSON object of the event or 404 if not found
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(event_id):
            return jsonify({"error": "Invalid event ID format"}), 400

        db = get_database()
        events_collection = db.events

        # Find event by ID
        event = events_collection.find_one({'_id': ObjectId(event_id)})

        if not event:
            return jsonify({"error": "Event not found"}), 404

        # Convert ObjectId to string for JSON serialization
        event['_id'] = str(event['_id'])
        if 'created_at' in event:
            event['created_at'] = event['created_at'].isoformat()
        if 'updated_at' in event:
            event['updated_at'] = event['updated_at'].isoformat()

        return jsonify(event), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch event: {str(e)}"}), 500


@events_bp.route('/<event_id>', methods=['PUT'])
def update_event(event_id):
    """
    Update an event.

    URL parameters:
        - event_id: MongoDB ObjectId of the event

    Request body: (partial updates allowed)
    {
        "title": "Updated Event Name",
        "status": "completed"
    }

    Returns:
        JSON object of the updated event
    """
    try:
        if not ObjectId.is_valid(event_id):
            return jsonify({"error": "Invalid event ID format"}), 400

        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is empty"}), 400

        db = get_database()
        events_collection = db.events

        # Validate only the fields provided
        valid_fields = ['title', 'date', 'start_time', 'end_time', 'club', 'status']
        for field in data:
            if field not in valid_fields:
                return jsonify({"error": f"Invalid field: {field}"}), 400

        # Validate status if provided
        if 'status' in data:
            valid_statuses = ['scheduled', 'ongoing', 'completed', 'cancelled', 'pending', 'conflict', 'approved', 'rejected']
            if data['status'] not in valid_statuses:
                return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

        # Add updated_at timestamp
        update_data = {
            **data,
            "updated_at": datetime.utcnow()
        }

        # Update event
        result = events_collection.find_one_and_update(
            {'_id': ObjectId(event_id)},
            {'$set': update_data},
            return_document=True
        )

        if not result:
            return jsonify({"error": "Event not found"}), 404

        # Convert ObjectId to string for JSON serialization
        result['_id'] = str(result['_id'])
        if 'created_at' in result:
            result['created_at'] = result['created_at'].isoformat()
        if 'updated_at' in result:
            result['updated_at'] = result['updated_at'].isoformat()

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update event: {str(e)}"}), 500


@events_bp.route('/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    """
    Delete an event.

    URL parameters:
        - event_id: MongoDB ObjectId of the event

    Returns:
        Success message or 404 if not found
    """
    try:
        if not ObjectId.is_valid(event_id):
            return jsonify({"error": "Invalid event ID format"}), 400

        db = get_database()
        events_collection = db.events

        # Delete event
        result = events_collection.delete_one({'_id': ObjectId(event_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Event not found"}), 404

        return jsonify({"message": "Event deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete event: {str(e)}"}), 500
