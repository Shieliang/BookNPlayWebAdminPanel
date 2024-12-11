from flask import Flask, render_template, request
from pymongo import MongoClient

app = Flask(__name__)

# MongoDB connection
client = MongoClient("your_mongo_connection_string")
db = client["FacilityDB"]
facility_collection = db["Facility"]

@app.route('/')
def index():
    facilities = facility_collection.find()
    return render_template('index.html', facilities=facilities)

@app.route('/book', methods=['POST'])
def book():
    facility_id = request.form.get('facility_id')
    # Booking logic here
    return f"Facility with ID {facility_id} booked!"

if __name__ == '__main__':
    app.run(debug=True)
