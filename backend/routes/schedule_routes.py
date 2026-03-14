from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from config.db import get_database

schedule_bp = Blueprint('schedule', __name__, url_prefix='/schedule')


def validate_schedule_data(data):
    """
    Validate schedule data.

    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['subject', 'date', 'start_time', 'end_time', 'type']

    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"

    # Validate type values
    valid_types = ['lecture', 'practical', 'exam']
    if data['type'] not in valid_types:
        return False, f"Invalid type. Must be one of: {', '.join(valid_types)}"

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

    # Validate that subject is not empty
    if not data.get('subject', '').strip():
        return False, "Subject cannot be empty"

    return True, None


@schedule_bp.route('', methods=['POST'])
def create_schedule():
    """
    Create a new schedule entry.

    Request body:
    {
        "subject": "Data Structures",
        "date": "2026-03-15",
        "start_time": "09:00",
        "end_time": "11:00",
        "type": "lecture"
    }

    Returns:
        JSON with created schedule and 201 status
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is empty"}), 400

        # Validate schedule data
        is_valid, error_message = validate_schedule_data(data)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        # Get MongoDB database and collection
        db = get_database()
        schedule_collection = db.schedule

        # Add created_at and updated_at timestamps
        schedule_data = {
            **data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert schedule into database
        result = schedule_collection.insert_one(schedule_data)

        # Return the created schedule with its ID
        schedule_data['_id'] = str(result.inserted_id)
        return jsonify(schedule_data), 201

    except Exception as e:
        return jsonify({"error": f"Failed to create schedule: {str(e)}"}), 500


@schedule_bp.route('', methods=['GET'])
def get_schedule():
    """
    Get all schedule entries with optional filtering.

    Query parameters:
        - subject: Filter by subject name
        - date: Filter by date (YYYY-MM-DD)
        - type: Filter by type (lecture, practical, exam)

    Returns:
        JSON array of schedule entries
    """
    try:
        db = get_database()
        schedule_collection = db.schedule

        # Build filter based on query parameters
        filter_query = {}

        subject = request.args.get('subject')
        if subject:
            # Case-insensitive subject search
            filter_query['subject'] = {'$regex': subject, '$options': 'i'}

        date = request.args.get('date')
        if date:
            filter_query['date'] = date

        schedule_type = request.args.get('type')
        if schedule_type:
            if schedule_type not in ['lecture', 'practical', 'exam']:
                return jsonify({"error": "Invalid type filter. Must be: lecture, practical, or exam"}), 400
            filter_query['type'] = schedule_type

        # Fetch schedule entries from database, sorted by date and start_time
        schedules = list(schedule_collection.find(filter_query).sort([
            ('date', 1),
            ('start_time', 1)
        ]))

        # Convert ObjectId to string for JSON serialization
        for schedule in schedules:
            schedule['_id'] = str(schedule['_id'])
            # Handle datetime serialization
            if 'created_at' in schedule:
                schedule['created_at'] = schedule['created_at'].isoformat()
            if 'updated_at' in schedule:
                schedule['updated_at'] = schedule['updated_at'].isoformat()

        return jsonify({
            "count": len(schedules),
            "schedules": schedules
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch schedule: {str(e)}"}), 500


@schedule_bp.route('/<schedule_id>', methods=['GET'])
def get_schedule_by_id(schedule_id):
    """
    Get a specific schedule entry by ID.

    URL parameters:
        - schedule_id: MongoDB ObjectId of the schedule

    Returns:
        JSON object of the schedule or 404 if not found
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(schedule_id):
            return jsonify({"error": "Invalid schedule ID format"}), 400

        db = get_database()
        schedule_collection = db.schedule

        # Find schedule by ID
        schedule = schedule_collection.find_one({'_id': ObjectId(schedule_id)})

        if not schedule:
            return jsonify({"error": "Schedule not found"}), 404

        # Convert ObjectId to string for JSON serialization
        schedule['_id'] = str(schedule['_id'])
        if 'created_at' in schedule:
            schedule['created_at'] = schedule['created_at'].isoformat()
        if 'updated_at' in schedule:
            schedule['updated_at'] = schedule['updated_at'].isoformat()

        return jsonify(schedule), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch schedule: {str(e)}"}), 500


@schedule_bp.route('/<schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    """
    Update a schedule entry.

    URL parameters:
        - schedule_id: MongoDB ObjectId of the schedule

    Request body: (partial updates allowed)
    {
        "subject": "Advanced Data Structures",
        "type": "practical"
    }

    Returns:
        JSON object of the updated schedule
    """
    try:
        if not ObjectId.is_valid(schedule_id):
            return jsonify({"error": "Invalid schedule ID format"}), 400

        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is empty"}), 400

        db = get_database()
        schedule_collection = db.schedule

        # Validate only the fields provided
        valid_fields = ['subject', 'date', 'start_time', 'end_time', 'type']
        for field in data:
            if field not in valid_fields:
                return jsonify({"error": f"Invalid field: {field}"}), 400

        # Validate type if provided
        if 'type' in data:
            valid_types = ['lecture', 'practical', 'exam']
            if data['type'] not in valid_types:
                return jsonify({"error": f"Invalid type. Must be one of: {', '.join(valid_types)}"}), 400

        # Add updated_at timestamp
        update_data = {
            **data,
            "updated_at": datetime.utcnow()
        }

        # Update schedule
        result = schedule_collection.find_one_and_update(
            {'_id': ObjectId(schedule_id)},
            {'$set': update_data},
            return_document=True
        )

        if not result:
            return jsonify({"error": "Schedule not found"}), 404

        # Convert ObjectId to string for JSON serialization
        result['_id'] = str(result['_id'])
        if 'created_at' in result:
            result['created_at'] = result['created_at'].isoformat()
        if 'updated_at' in result:
            result['updated_at'] = result['updated_at'].isoformat()

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update schedule: {str(e)}"}), 500


@schedule_bp.route('/<schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """
    Delete a schedule entry.

    URL parameters:
        - schedule_id: MongoDB ObjectId of the schedule

    Returns:
        Success message or 404 if not found
    """
    try:
        if not ObjectId.is_valid(schedule_id):
            return jsonify({"error": "Invalid schedule ID format"}), 400

        db = get_database()
        schedule_collection = db.schedule

        # Delete schedule
        result = schedule_collection.delete_one({'_id': ObjectId(schedule_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Schedule not found"}), 404

        return jsonify({"message": "Schedule deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete schedule: {str(e)}"}), 500


@schedule_bp.route('', methods=['DELETE'])
def delete_all_schedule():
    """
    Delete all schedule entries.
    WARNING: This is a bulk delete operation.

    Returns:
        Success message with count of deleted documents
    """
    try:
        db = get_database()
        schedule_collection = db.schedule

        # Delete all schedules
        result = schedule_collection.delete_many({})

        return jsonify({
            "message": f"{result.deleted_count} schedule(s) deleted successfully",
            "deleted_count": result.deleted_count
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete schedules: {str(e)}"}), 500
