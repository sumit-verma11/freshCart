// MongoDB initialization script — runs once on first container boot
db = db.getSiblingDB("freshcart");

db.createCollection("users");
db.createCollection("products");
db.createCollection("orders");

print("FreshCart database initialized successfully.");
