from flask import Flask, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["acadsync"]

print("MongoDB Connected Successfully")


@app.route("/")
def home():
    return "AcadSync AI Backend Running"


# API to insert user
@app.route("/add-user", methods=["POST"])
def add_user():
    data = request.json

    user = {
        "name": data["name"],
        "email": data["email"],
        "role": "student"
    }

    db.users.insert_one(user)

    return jsonify({"message": "User added successfully"})

@app.route("/users", methods=["GET"])
def get_users():

    users = list(db.users.find({}, {"_id":0}))

    return {"users": users}

@app.route("/add-document", methods=["POST"])
def add_document():

    data = request.json

    document = {
        "title": data["title"],
        "subject": data["subject"],
        "description": data["description"],
        "tags": data["tags"],
        "uploaded_by": data["uploaded_by"]
    }

    db.documents.insert_one(document)

    return {"message": "Document added"}

@app.route("/documents/<user>", methods=["GET"])
def get_user_documents(user):

    docs = list(db.documents.find({"uploaded_by": user}, {"_id":0}))

    return {"documents": docs}

@app.route("/delete-document/<title>", methods=["DELETE"])
def delete_document(title):

    db.documents.delete_one({"title": title})

    return {"message": "Document deleted"}

@app.route("/search", methods=["GET"])
def search_documents():

    subject = request.args.get("subject")

    results = list(db.documents.find({"subject": subject}, {"_id": 0}))

    return {"results": results}


if __name__ == "__main__":
    app.run(debug=True)