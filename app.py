from flask import Flask, render_template, request
from pymongo import MongoClient

app = Flask(__name__)

# MongoDB connection
client = MongoClient("mongodb+srv://shieliang22:shieliang2002@booknplay.vtags.mongodb.net/")
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
    app.run(host = '0.0.0.0', port = 80, debug = False)
