from datetime import datetime
from config.db import get_database


def time_to_minutes(time_str):
    """
    Convert time string (HH:MM) to minutes since midnight.

    Args:
        time_str: Time in HH:MM format (e.g., "09:00", "14:30")

    Returns:
        int: Minutes since midnight

    Raises:
        ValueError: If time format is invalid
    """
    try:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    except (ValueError, AttributeError):
        raise ValueError(f"Invalid time format: {time_str}. Use HH:MM format.")


def times_overlap(start1, end1, start2, end2):
    """
    Check if two time ranges overlap.

    Args:
        start1: Start time of first range (HH:MM format)
        end1: End time of first range (HH:MM format)
        start2: Start time of second range (HH:MM format)
        end2: End time of second range (HH:MM format)

    Returns:
        bool: True if times overlap, False otherwise

    Example:
        times_overlap("09:00", "11:00", "10:30", "12:00")  # True
        times_overlap("09:00", "11:00", "11:30", "13:00")  # False
    """
    start1_min = time_to_minutes(start1)
    end1_min = time_to_minutes(end1)
    start2_min = time_to_minutes(start2)
    end2_min = time_to_minutes(end2)

    # Two ranges overlap if one doesn't end before the other starts
    return start1_min < end2_min and start2_min < end1_min


def check_event_conflict(event_date, event_start_time, event_end_time, exclude_event_id=None):
    """
    Check if an event time overlaps with any academic schedule entry on the same date.

    Args:
        event_date: Event date in YYYY-MM-DD format
        event_start_time: Event start time in HH:MM format
        event_end_time: Event end time in HH:MM format
        exclude_event_id: Optional event ID to exclude from conflict check

    Returns:
        dict: {
            "conflict": bool,
            "conflicting_schedules": list of conflicting schedule entries
        }

    Example:
        result = check_event_conflict("2026-03-20", "09:00", "11:00")
        if result["conflict"]:
            print(f"Conflict found: {result['conflicting_schedules']}")
    """
    try:
        # Validate date format
        datetime.strptime(event_date, '%Y-%m-%d')

        # Validate time format and get minutes
        event_start_min = time_to_minutes(event_start_time)
        event_end_min = time_to_minutes(event_end_time)

        # Get database connection
        db = get_database()
        schedule_collection = db.schedule

        # Query for schedule entries on the same date
        schedules_on_date = list(schedule_collection.find({'date': event_date}))

        conflicting_schedules = []

        # Check each schedule entry for overlap
        for schedule in schedules_on_date:
            schedule_start = schedule.get('start_time')
            schedule_end = schedule.get('end_time')

            # Check if times overlap
            if times_overlap(event_start_time, event_end_time, schedule_start, schedule_end):
                conflicting_schedules.append({
                    "_id": str(schedule['_id']),
                    "subject": schedule.get('subject'),
                    "type": schedule.get('type'),
                    "start_time": schedule_start,
                    "end_time": schedule_end
                })

        return {
            "conflict": len(conflicting_schedules) > 0,
            "conflicting_schedules": conflicting_schedules
        }

    except ValueError as e:
        return {
            "conflict": False,
            "error": str(e),
            "conflicting_schedules": []
        }
    except Exception as e:
        return {
            "conflict": False,
            "error": f"Error checking conflicts: {str(e)}",
            "conflicting_schedules": []
        }


def check_schedule_conflict(schedule_date, schedule_start_time, schedule_end_time, exclude_schedule_id=None):
    """
    Check if a schedule entry time overlaps with any event on the same date.

    Args:
        schedule_date: Schedule date in YYYY-MM-DD format
        schedule_start_time: Schedule start time in HH:MM format
        schedule_end_time: Schedule end time in HH:MM format
        exclude_schedule_id: Optional schedule ID to exclude from conflict check

    Returns:
        dict: {
            "conflict": bool,
            "conflicting_events": list of conflicting events
        }
    """
    try:
        # Validate date format
        datetime.strptime(schedule_date, '%Y-%m-%d')

        # Validate time format and get minutes
        schedule_start_min = time_to_minutes(schedule_start_time)
        schedule_end_min = time_to_minutes(schedule_end_time)

        # Get database connection
        db = get_database()
        events_collection = db.events

        # Query for events on the same date
        events_on_date = list(events_collection.find({'date': schedule_date}))

        conflicting_events = []

        # Check each event for overlap
        for event in events_on_date:
            event_start = event.get('start_time')
            event_end = event.get('end_time')

            # Check if times overlap
            if times_overlap(schedule_start_time, schedule_end_time, event_start, event_end):
                conflicting_events.append({
                    "_id": str(event['_id']),
                    "title": event.get('title'),
                    "club": event.get('club'),
                    "start_time": event_start,
                    "end_time": event_end
                })

        return {
            "conflict": len(conflicting_events) > 0,
            "conflicting_events": conflicting_events
        }

    except ValueError as e:
        return {
            "conflict": False,
            "error": str(e),
            "conflicting_events": []
        }
    except Exception as e:
        return {
            "conflict": False,
            "error": f"Error checking conflicts: {str(e)}",
            "conflicting_events": []
        }


def get_daily_conflict_report(date):
    """
    Get a complete conflict report for a specific date showing overlaps between
    events and schedules.

    Args:
        date: Date in YYYY-MM-DD format

    Returns:
        dict: {
            "date": date,
            "total_conflicts": count,
            "conflict_pairs": list of conflicting event-schedule pairs
        }
    """
    try:
        # Validate date format
        datetime.strptime(date, '%Y-%m-%d')

        # Get database connections
        db = get_database()
        events_collection = db.events
        schedule_collection = db.schedule

        # Get all events and schedules for the date
        events = list(events_collection.find({'date': date}))
        schedules = list(schedule_collection.find({'date': date}))

        conflict_pairs = []

        # Check each event against each schedule
        for event in events:
            event_start = event.get('start_time')
            event_end = event.get('end_time')

            for schedule in schedules:
                schedule_start = schedule.get('start_time')
                schedule_end = schedule.get('end_time')

                # Check if times overlap
                if times_overlap(event_start, event_end, schedule_start, schedule_end):
                    conflict_pairs.append({
                        "event": {
                            "_id": str(event['_id']),
                            "title": event.get('title'),
                            "club": event.get('club'),
                            "start_time": event_start,
                            "end_time": event_end
                        },
                        "schedule": {
                            "_id": str(schedule['_id']),
                            "subject": schedule.get('subject'),
                            "type": schedule.get('type'),
                            "start_time": schedule_start,
                            "end_time": schedule_end
                        }
                    })

        return {
            "date": date,
            "total_conflicts": len(conflict_pairs),
            "conflict_pairs": conflict_pairs
        }

    except ValueError as e:
        return {
            "date": date,
            "total_conflicts": 0,
            "error": str(e),
            "conflict_pairs": []
        }
    except Exception as e:
        return {
            "date": date,
            "total_conflicts": 0,
            "error": f"Error generating conflict report: {str(e)}",
            "conflict_pairs": []
        }
