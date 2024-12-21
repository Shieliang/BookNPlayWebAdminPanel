from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient

app = Flask(__name__)

# MongoDB connection
client = MongoClient("mongodb+srv://shieliang22:shieliang2002@booknplay.vtags.mongodb.net/")
db = client["FacilityDB"]
user_collection = db["Users"]
facility_collection = db["Facility"]
booking_collection = db["Bookings"]

# Home route to render the dashboard
@app.route('/')
def index():
    return render_template('index.html')

# Users CRUD
@app.route('/api/users', methods=['GET', 'POST'])
def manage_users():
    if request.method == 'GET':
        users = list(user_collection.find())
        for user in users:
            user['_id'] = str(user['_id'])  # Ensure _id is returned as string
        return jsonify(users)
    elif request.method == 'POST':
        new_user = {
            'name': request.json['name'],
            'email': request.json['email'],
            'role': request.json['role']
        }
        result = user_collection.insert_one(new_user)
        new_user['_id'] = str(result.inserted_id)
        return jsonify(new_user), 201

@app.route('/api/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user_collection.delete_one({"_id": user_id})
    return '', 204

# Facilities CRUD
@app.route('/api/facilities', methods=['GET', 'POST'])
def manage_facilities():
    if request.method == 'GET':
        facilities = list(facility_collection.find())
        for facility in facilities:
            facility['_id'] = str(facility['_id'])
        return jsonify(facilities)
    elif request.method == 'POST':
        new_facility = {
            'name': request.json['name'],
            'location': request.json['location'],
            'status': request.json['status']
        }
        result = facility_collection.insert_one(new_facility)
        new_facility['_id'] = str(result.inserted_id)
        return jsonify(new_facility), 201

@app.route('/api/facilities/<string:facility_id>', methods=['DELETE'])
def delete_facility(facility_id):
    facility_collection.delete_one({"_id": facility_id})
    return '', 204

# Bookings CRUD
@app.route('/api/bookings', methods=['GET', 'POST'])
def manage_bookings():
    if request.method == 'GET':
        bookings = list(booking_collection.find())
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
        return jsonify(bookings)
    elif request.method == 'POST':
        new_booking = {
            'user': request.json['user'],
            'facility': request.json['facility'],
            'date': request.json['date'],
            'status': request.json['status']
        }
        result = booking_collection.insert_one(new_booking)
        new_booking['_id'] = str(result.inserted_id)
        return jsonify(new_booking), 201

@app.route('/api/bookings/<string:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    booking_collection.delete_one({"_id": booking_id})
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)
