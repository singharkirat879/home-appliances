const request = require("supertest");
const app = require("../../app");
const db = require("../../config/db");
const bcrypt = require("bcryptjs");

// Mock the database connection so we don't actually save users
jest.mock("../../config/db");

describe("Auth API - Registration Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if fields are missing", async () => {
    // Act: Send a request without an email
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", password: "password123" });
    
    // Assert: Check that our validation logic catches the missing field
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All fields are required" });
  });

  it("should return 400 if email is invalid", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "John", email: "not-an-email", password: "password123" });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Please provide a valid email address" });
  });

  it("should return 400 if password is too short", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "John", email: "john@example.com", password: "123" }); // Less than 6 chars
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Password must be at least 6 characters long" });
  });

  it("should successfully register a user if all data is valid", async () => {
    // Arrange: Fake the database returning "0 rows" when checking if email exists
    db.query.mockImplementationOnce((query, params, callback) => {
      // First query is "SELECT email FROM users WHERE email = ?"
      callback(null, []); // Empty array means email is not taken
    });

    // Fake the database successfully inserting the user
    db.query.mockImplementationOnce((query, params, callback) => {
      // Second query is "INSERT INTO users..."
      callback(null, { insertId: 1 });
    });

    // Act
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "john@example.com", password: "validpassword123" });
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "User registered successfully" });
  });
});
