from flask import Blueprint, request, jsonify
from routes.conflict_service import (
    check_event_conflict,
    check_schedule_conflict,
    get_daily_conflict_report
)

conflicts_bp = Blueprint('conflicts', __name__, url_prefix='/conflicts')


@conflicts_bp.route('/events', methods=['POST'])
def check_event_conflicts():
    """
    Check if an event overlaps with any academic schedule.

    Request body:
    {
        "date": "2026-03-20",
        "start_time": "09:00",
        "end_time": "11:00"
    }

    Returns:
        {
            "conflict": true/false,
            "conflicting_schedules": [
                {
                    "_id": "...",
                    "subject": "Data Structures",
                    "type": "lecture",
                    "start_time": "09:30",
                    "end_time": "11:00"
                }
            ]
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is empty"}), 400

        # Validate required fields
        required_fields = ['date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Check for conflicts
        result = check_event_conflict(
            data['date'],
            data['start_time'],
            data['end_time']
        )

        if 'error' in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Failed to check event conflicts: {str(e)}"}), 500


@conflicts_bp.route('/schedules', methods=['POST'])
def check_schedule_conflicts():
    """
    Check if a schedule entry overlaps with any event.

    Request body:
    {
        "date": "2026-03-20",
        "start_time": "09:00",
        "end_time": "11:00"
    }

    Returns:
        {
            "conflict": true/false,
            "conflicting_events": [
                {
                    "_id": "...",
                    "title": "Tech Workshop",
                    "club": "Tech Club",
                    "start_time": "09:30",
                    "end_time": "11:00"
                }
            ]
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is empty"}), 400

        # Validate required fields
        required_fields = ['date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Check for conflicts
        result = check_schedule_conflict(
            data['date'],
            data['start_time'],
            data['end_time']
        )

        if 'error' in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Failed to check schedule conflicts: {str(e)}"}), 500


@conflicts_bp.route('/report/<date>', methods=['GET'])
def get_conflict_report(date):
    """
    Get a complete conflict report for a specific date.
    Shows all overlapping event-schedule pairs.

    URL parameters:
        - date: Date in YYYY-MM-DD format

    Returns:
        {
            "date": "2026-03-20",
            "total_conflicts": 2,
            "conflict_pairs": [
                {
                    "event": {
                        "_id": "...",
                        "title": "Tech Workshop",
                        "club": "Tech Club",
                        "start_time": "09:00",
                        "end_time": "11:00"
                    },
                    "schedule": {
                        "_id": "...",
                        "subject": "Data Structures",
                        "type": "lecture",
                        "start_time": "09:30",
                        "end_time": "11:00"
                    }
                }
            ]
        }
    """
    try:
        result = get_daily_conflict_report(date)

        if 'error' in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Failed to generate conflict report: {str(e)}"}), 500
