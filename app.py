from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import requests
from functools import wraps
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from bson import ObjectId
import os
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# MongoDB connection
client = MongoClient(os.getenv("MONGO_URI"))
facility_db = client["FacilityDB"]
booking_db = client["BookingDB"]
facility_collection = facility_db["Facility"]
booking_collection = booking_db["Booking"]

# Auth0 configuration
AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
API_IDENTIFIER = os.getenv('API_IDENTIFIER')
AUTH0_CLIENT_ID = os.getenv('AUTH0_CLIENT_ID')
AUTH0_CLIENT_SECRET = os.getenv('AUTH0_CLIENT_SECRET')
ALGORITHMS = ["RS256"]

# Admin login (static credentials)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin'] = True
            return redirect(url_for('index'))
        else:
            return render_template("login.html", error="Invalid credentials!")
    return render_template("login.html")

@app.route('/logout')
def logout():
    session.pop('admin', None)
    return redirect(url_for('login'))

@app.route('/index')
def index():
    if 'admin' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/user_management', methods=['GET'])
def user_management():
    if 'admin' not in session:
        return redirect(url_for('login'))

    try:
        token = get_management_api_token()
        headers = {
            "Authorization": f"Bearer {token}"
        }
        url = f"https://{AUTH0_DOMAIN}/api/v2/users"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            users = response.json()
            print(f"Users: {users}")  # Log users for debugging
            return render_template("user_management.html", users=users)
        else:
            print(f"Error fetching users: {response.status_code} {response.text}")
            return render_template("user_management.html", error="Error fetching users.", users=[])

    except requests.exceptions.RequestException as e:
        print(f"Request exception: {str(e)}")
        return render_template("user_management.html", error=str(e), users=[])

@app.route('/user_management/create', methods=['POST'])
def create_user():
    if 'admin' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        email = request.form['email']
        name = request.form['name']
        password = request.form['password']

        try:
            token = get_management_api_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            user_data = {
                "email": email,
                "name": name,
                "password": password,
                "connection": "Username-Password-Authentication",
            }

            url = f"https://{AUTH0_DOMAIN}/api/v2/users"
            response = requests.post(url, headers=headers, json=user_data)

            if response.status_code == 201:
                return jsonify({"success": True})
            else:
                return jsonify({"success": False, "error": response.json()})

        except requests.exceptions.RequestException as e:
            return jsonify({"success": False, "error": str(e)})

@app.route('/user_management/delete/<user_id>', methods=['POST'])
def delete_user(user_id):
    if 'admin' not in session:
        return redirect(url_for('login'))

    try:
        token = get_management_api_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        url = f"https://{AUTH0_DOMAIN}/api/v2/users/{user_id}"
        response = requests.delete(url, headers=headers)

        if response.status_code == 204:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": response.json()})

    except requests.exceptions.RequestException as e:
        return jsonify({"success": False, "error": str(e)})
     
@app.route('/facility_management', methods=['GET'])
def facility_management():
    if 'admin' not in session:
        return redirect(url_for('login'))

    try:
        facilities = list(facility_collection.find({}))
        return render_template('facility_management.html', facilities=facilities)

    except Exception as e:
        print(f"Error fetching facilities: {str(e)}")
        return render_template('facility_management.html', error="Error fetching facilities.", facilities=[])

@app.route('/facility_management/create', methods=['POST'])
def create_facility():
    if 'admin' not in session:
        return redirect(url_for('login'))

    name = request.form['facility_name']
    location = request.form['location']
    open_time = request.form['operation_open']
    close_time = request.form['operation_close']

    # Convert times to AM/PM format
    open_time_am_pm = format_time_to_am_pm(open_time)
    close_time_am_pm = format_time_to_am_pm(close_time)

    try:
        new_facility = {
            "facility_name": name,
            "location": location,
            "operation_time": {
                "open": open_time_am_pm,
                "close": close_time_am_pm
            },
            "booking_time_slots": [],  # Empty by default
            "status": "active"
        }
        facility_collection.insert_one(new_facility)
        return redirect(url_for('facility_management'))
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Helper function to convert 24-hour format to 12-hour AM/PM format
def format_time_to_am_pm(time_str):
    time_obj = datetime.strptime(time_str, "%H:%M")  # Parse 24-hour time
    return time_obj.strftime("%I:%M %p").lstrip('0')  # Convert to 12-hour AM/PM format
    
@app.route('/add/<facility_id>', methods=['POST'])
def add_time_slot(facility_id):
    if 'admin' not in session:
        return redirect(url_for('login'))
    
    # Get form data
    start_time = request.form['start_time']
    end_time = request.form['end_time']
    status = request.form['status']
    
    try:
        # Format the start and end times to 12-hour AM/PM format
        formatted_start_time = format_time_to_am_pm(start_time)
        formatted_end_time = format_time_to_am_pm(end_time)
        
        # Find the facility by ID
        facility = facility_collection.find_one({"_id": ObjectId(facility_id)})
        
        if not facility:
            return jsonify({"success": False, "error": "Facility not found!"})

        # Add the new time slot to the facility's booking_time_slots
        facility_collection.update_one(
            {"_id": ObjectId(facility_id)},
            {"$push": {"booking_time_slots": {
                "start_time": formatted_start_time,
                "end_time": formatted_end_time,
                "status": status
            }}}
        )
        
        return redirect(url_for('facility_management'))  # Redirect to the facility management page
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    
@app.route('/delete/<facility_id>/<slot_start_time>', methods=['POST'])
def delete_time_slot(facility_id, slot_start_time):
    if 'admin' not in session:
        return redirect(url_for('login'))

    try:
        # Find the facility by its ID (using ObjectId if it's in MongoDB)
        facility = facility_collection.find_one({'_id': ObjectId(facility_id)})

        if facility:
            # Remove the time slot from the facility's time_slots array
            facility_collection.update_one(
                {'_id': ObjectId(facility_id)},
                {'$pull': {'booking_time_slots': {'start_time': slot_start_time}}}
            )

            return redirect(url_for('facility_management'))  # Redirect back to the facility management page

        else:
            return redirect(url_for('facility_management', error="Facility not found."))

    except Exception as e:
        print(f"Error deleting time slot: {str(e)}")
        return redirect(url_for('facility_management', error="Error deleting time slot."))
    
@app.route('/facility_management/update/<facility_id>', methods=['POST'])
def update_facility(facility_id):
    if 'admin' not in session:
        return redirect(url_for('login'))

    name = request.form['facility_name']
    location = request.form['location']
    open_time = request.form['operation_open']
    close_time = request.form['operation_close']
    status = request.form['status']

    # Convert times to AM/PM format
    open_time_am_pm = format_time_to_am_pm(open_time)
    close_time_am_pm = format_time_to_am_pm(close_time)

    try:
        facility_collection.update_one(
            {"_id": ObjectId(facility_id)},
            {"$set": {
                "facility_name": name,
                "location": location,
                "operation_time": {"open": open_time_am_pm, "close": close_time_am_pm},
                "status": status
            }}
        )
        return redirect(url_for('facility_management'))
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    
@app.route('/delete/<facility_id>', methods=['POST'])
def delete_facility(facility_id):
    if 'admin' not in session:
        return redirect(url_for('login'))

    try:
        # Delete the facility from the database using its ObjectId
        result = facility_collection.delete_one({"_id": ObjectId(facility_id)})
        
        if result.deleted_count == 0:
            return jsonify({"success": False, "error": "Facility not found!"})
        
        return redirect(url_for('facility_management'))  # Redirect to the facility management page after deletion
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
 
@app.route('/booking_management', methods=['GET', 'POST'])
def booking_management():
    # Check if the user is an admin
    if 'admin' not in session:
        return redirect(url_for('login'))

    try:
        # Fetch the booking and facility data from the database
        bookings = list(booking_collection.find({}))  # Get all bookings
        facilities = list(facility_collection.find({}))  # Get all facilities

        # Convert MongoDB ObjectId and Date fields to JSON serializable format
        for booking in bookings:
            booking['_id'] = str(booking['_id'])  # Convert ObjectId to string
            booking['Date'] = booking['Date'].strftime("%Y-%m-%d %H:%M:%S")  # Format Date field

        # Handle form submission for booking creation
        if request.method == 'POST':
            # Get the user and booking details from the form
            user_name = request.form.get('user_name')
            student_id = request.form.get('student_id')
            student_name = request.form.get('student_name')
            phone_number = request.form.get('phone_number')
            user_id = request.form.get('user_id')

            # Get the facility and booking details from the form
            facility_name = request.form.get('facility_name')
            time_slot = request.form.get('time_slot')
            selected_date = request.form.get('selected_date')

            # Convert the selected date string to a datetime object
            try:
                booking_date = datetime.strptime(selected_date, '%Y-%m-%d')  # Adjust format if needed
            except ValueError:
                return render_template('booking_management.html', error="Invalid date format. Please use YYYY-MM-DD.", bookings=bookings, facilities=facilities)

            # Insert the new booking into the MongoDB collection
            booking_collection.insert_one({
                'FacilityName': facility_name,
                'Time': time_slot,
                'Date': booking_date,
                'UserName': user_name,
                'StudentId': student_id,
                'StudentName': student_name,
                'UserID': user_id,
                'PhoneNumber': phone_number,
                'Status': 'Pending'  # Default status is 'Pending'
            })

            # After successful booking, redirect to the same page to refresh the list
            return redirect(url_for('booking_management'))

        # Render the booking management page with booking and facility data
        return render_template('booking_management.html', bookings=bookings, facilities=facilities)

    except Exception as e:
        # Error handling in case there is an issue fetching data from the database
        print(f"Error fetching bookings: {str(e)}")
        return render_template('booking_management.html', error="Error fetching bookings.", bookings=[], facilities=facilities)
    
# Route to handle fetching time slots for a selected facility
@app.route('/get-time-slots')
def get_time_slots():
    # Get the 'facility_name' query parameter from the request
    facility_name = request.args.get('facility_name')

    # Fetch the document for the selected facility from MongoDB
    facility = facility_collection.find_one({"facility_name": facility_name}, {"_id": 0, "booking_time_slots": 1})

    if facility:
        # Return the booking time slots for the facility
        return jsonify({"booking_time_slots": facility["booking_time_slots"]})
    else:
        # Return an empty list if the facility doesn't exist
        return jsonify({"booking_time_slots": []}), 404

    
@app.route('/delete-booking', methods=['POST'])
def delete_booking():
    # Get the booking ID from the form
    booking_id = request.form.get('booking_id')

    # Convert the booking_id to ObjectId
    try:
        booking_id = ObjectId(booking_id)
    except Exception as e:
        # Handle the case where the booking_id is invalid or not properly formatted
        print(f"Error converting booking_id to ObjectId: {e}")
        return redirect(url_for('booking_management'))

    # Delete the booking from the database
    booking_collection.delete_one({'_id': booking_id})

    # Redirect to the index page to refresh the booking list
    return redirect(url_for('booking_management'))


@app.route('/update-booking', methods=['POST'])
def update_booking():
    # Get the booking ID and new status from the form
    booking_id = request.form.get('booking_id')
    new_status = request.form.get('status')

    # Convert the booking_id to ObjectId
    try:
        booking_id = ObjectId(booking_id)
    except Exception as e:
        # Handle the case where the booking_id is invalid or not properly formatted
        print(f"Error converting booking_id to ObjectId: {e}")
        return redirect(url_for('booking_management'))

    # Update the status of the booking in the database
    booking_collection.update_one(
        {'_id': booking_id},  # Filter by booking ID
        {'$set': {'Status': new_status}}  # Set the new status
    )

    # Redirect to the index page to refresh the booking list
    return redirect(url_for('booking_management'))


# Function to get Auth0 Management API token
def get_management_api_token():
    url = f"https://{AUTH0_DOMAIN}/oauth/token"
    payload = {
        "client_id": AUTH0_CLIENT_ID,
        "client_secret": AUTH0_CLIENT_SECRET,
        "audience": API_IDENTIFIER,
        "grant_type": "client_credentials"
    }
    response = requests.post(url, json=payload)
    
    # Check if the request was successful
    if response.status_code != 200:
        raise Exception(f"Error fetching token: {response.status_code} {response.text}")
    return response.json().get("access_token")

if __name__ == '__main__':
    app.run(debug=True)
