from flask import Blueprint, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from config.db import get_database

admin_bp = Blueprint('admin', __name__, url_prefix='/events')


@admin_bp.route('/<event_id>/approve', methods=['PUT'])
def approve_event(event_id):
    """
    Approve a pending event.

    URL parameters:
        - event_id: MongoDB ObjectId of the event

    Returns:
        JSON object of the approved event
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(event_id):
            return jsonify({"error": "Invalid event ID format"}), 400

        db = get_database()
        events_collection = db.events

        # Check if event exists and is in pending status
        event = events_collection.find_one({'_id': ObjectId(event_id)})
        
        if not event:
            return jsonify({"error": "Event not found"}), 404

        # Update event status to approved
        update_data = {
            "status": "approved",
            "updated_at": datetime.utcnow()
        }

        result = events_collection.find_one_and_update(
            {'_id': ObjectId(event_id)},
            {'$set': update_data},
            return_document=True
        )

        # Convert ObjectId to string for JSON serialization
        result['_id'] = str(result['_id'])
        if 'created_at' in result:
            result['created_at'] = result['created_at'].isoformat()
        if 'updated_at' in result:
            result['updated_at'] = result['updated_at'].isoformat()

        return jsonify({
            "message": "Event approved successfully",
            "event": result
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to approve event: {str(e)}"}), 500


@admin_bp.route('/<event_id>/reject', methods=['PUT'])
def reject_event(event_id):
    """
    Reject a pending event.

    URL parameters:
        - event_id: MongoDB ObjectId of the event

    Returns:
        JSON object of the rejected event
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(event_id):
            return jsonify({"error": "Invalid event ID format"}), 400

        db = get_database()
        events_collection = db.events

        # Check if event exists
        event = events_collection.find_one({'_id': ObjectId(event_id)})
        
        if not event:
            return jsonify({"error": "Event not found"}), 404

        # Update event status to rejected
        update_data = {
            "status": "rejected",
            "updated_at": datetime.utcnow()
        }

        result = events_collection.find_one_and_update(
            {'_id': ObjectId(event_id)},
            {'$set': update_data},
            return_document=True
        )

        # Convert ObjectId to string for JSON serialization
        result['_id'] = str(result['_id'])
        if 'created_at' in result:
            result['created_at'] = result['created_at'].isoformat()
        if 'updated_at' in result:
            result['updated_at'] = result['updated_at'].isoformat()

        return jsonify({
            "message": "Event rejected successfully",
            "event": result
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to reject event: {str(e)}"}), 500
