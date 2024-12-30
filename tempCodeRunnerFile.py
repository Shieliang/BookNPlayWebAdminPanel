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
