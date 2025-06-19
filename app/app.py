from flask import Flask, render_template, request, redirect
import pymysql

app = Flask(__name__)

# Change these to match your MySQL setup
db = pymysql.connect(
    host="localhost",
    user="root",
    password="banggenius0309",
    database="bigbrain"
)

@app.route('/')
def form():
    return render_template('form.html')

@app.route('/submit', methods=['POST'])
def submit():
    name = request.form['name']
    activity = request.form['activity']

    cursor = db.cursor()
    sql = "INSERT INTO activity_log (name, activity) VALUES (%s, %s)"
    cursor.execute(sql, (name, activity))
    db.commit()

    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)