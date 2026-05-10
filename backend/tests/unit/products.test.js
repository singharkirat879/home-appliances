const request = require("supertest");
const app = require("../../app");
const db = require("../../config/db");

// Mock the database connection module
jest.mock("../../config/db");

describe("GET /api/products", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should return a list of products on success", async () => {
    // Arrange: Fake the database response
    const mockProducts = [
      { id: 1, name: "Washing Machine", price: 500 },
      { id: 2, name: "Refrigerator", price: 800 }
    ];
    
    // The route `app.get("/api/products")` calls `db.query(query, callback)`
    db.query.mockImplementation((query, callback) => {
      callback(null, mockProducts);
    });

    // Act: Make the HTTP GET request
    const response = await request(app).get("/api/products");
    
    // Assert: Verify the response
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProducts);
    // Verify db.query was called
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it("should return a 500 status on database error", async () => {
    // Arrange: Simulate a database error
    db.query.mockImplementation((query, callback) => {
      callback(new Error("Connection failed"), null);
    });

    // Act
    const response = await request(app).get("/api/products");
    
    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });
});

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a specific product when a valid ID is provided", async () => {
    // Arrange
    const mockProduct = { id: 1, name: "Washing Machine" };
    
    // The route `app.get("/api/products/:id")` calls `db.query(query, [id], callback)`
    db.query.mockImplementation((query, params, callback) => {
      // It expects the result to be an array and returns result[0]
      callback(null, [mockProduct]);
    });

    // Act
    const response = await request(app).get("/api/products/1");
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProduct);
    // Check if it passed the correct param
    expect(db.query.mock.calls[0][1]).toEqual(["1"]);
  });

  it("should return a 404 status when product is not found", async () => {
    // Arrange
    db.query.mockImplementation((query, params, callback) => {
      // Empty array means no rows found
      callback(null, []);
    });

    // Act
    const response = await request(app).get("/api/products/999");
    
    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Product not found" });
  });
});
