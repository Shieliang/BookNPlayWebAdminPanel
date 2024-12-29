from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import jwt
import json
import requests
from functools import wraps
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os

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

        
@app.route('/facility_management')
def facility_management():
    if 'admin' not in session:
        return redirect(url_for('login'))
    return render_template('facility_management.html')

@app.route('/booking_management')
def booking_management():
    if 'admin' not in session:
        return redirect(url_for('login'))
    return render_template('booking_management.html')

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
