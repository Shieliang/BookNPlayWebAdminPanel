from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# MongoDB connection
client = MongoClient("mongodb+srv://shieliang22:shieliang2002@booknplay.vtags.mongodb.net/")
facility_db = client["FacilityDB"]
booking_db = client["BookingDB"]
mflix_db = client["sample_mflix"]

# Collections
facility_collection = facility_db["Facility"]
booking_collection = booking_db["Booking"]
user_collection = mflix_db["users"]

# Home route to render the dashboard
@app.route('/')
def index():
    return render_template('index.html')

# Users CRUD
@app.route('/api/users', methods=['GET'])
def get_users():
    users = list(user_collection.find())
    for user in users:
        user['_id'] = str(user['_id'])  # Ensure _id is returned as string
        
        if 'password' in user:
            del user['password']
    
    return jsonify(users)

@app.route('/api/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user_collection.delete_one({"_id": user_id})
    return '', 204

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.get_json()
    result = user_collection.insert_one(data)
    new_user = user_collection.find_one({"_id": result.inserted_id})
    new_user['_id'] = str(new_user['_id'])  # Ensure _id is returned as string
    return jsonify(new_user), 201

@app.route('/api/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    user_collection.update_one({"_id": user_id}, {"$set": data})
    return '', 204

# Facilities CRUD
@app.route('/api/facilities', methods=['GET'])
def get_facilities():
    facilities = list(facility_collection.find())
    for facility in facilities:
        facility['_id'] = str(facility['_id'])  # Ensure _id is returned as string
    return jsonify(facilities)

@app.route('/api/facilities/<string:facility_id>', methods=['DELETE'])
def delete_facility(facility_id):
    facility_collection.delete_one({"_id": facility_id})
    return '', 204

@app.route('/api/facilities', methods=['POST'])
def add_facility():
    data = request.get_json()
    result = facility_collection.insert_one(data)
    new_facility = facility_collection.find_one({"_id": result.inserted_id})
    new_facility['_id'] = str(new_facility['_id'])  # Ensure _id is returned as string
    return jsonify(new_facility), 201

@app.route('/api/facilities/<string:facility_id>', methods=['PUT'])
def update_facility(facility_id):
    data = request.get_json()
    facility_collection.update_one({"_id": facility_id}, {"$set": data})
    return '', 204

# Bookings CRUD
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    bookings = list(booking_collection.find())
    for booking in bookings:
        booking['_id'] = str(booking['_id'])  # Ensure _id is returned as string
    return jsonify(bookings)

@app.route('/api/bookings', methods=['POST'])
def add_booking():
    data = request.get_json()
    result = booking_collection.insert_one(data)
    new_booking = booking_collection.find_one({"_id": result.inserted_id})
    new_booking['_id'] = str(new_booking['_id'])  # Ensure _id is returned as string
    return jsonify(new_booking), 201

@app.route('/api/bookings/<string:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    data = request.get_json()
    booking_collection.update_one({"_id": booking_id}, {"$set": data})
    return '', 204

@app.route('/api/bookings/<string:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    booking_collection.delete_one({"_id": booking_id})
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)