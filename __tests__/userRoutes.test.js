const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const { SECRET_KEY } = require("../config")

let testUserToken1;
let testUserToken2;
let u1, u2, m1, m2;

describe("User Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14199999999",
    });

    m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "hey test2, it's test1"
    });

    m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "hey test1, it's test2"
    });

    testUserToken1 = jwt.sign({username: u1.username}, SECRET_KEY);
    testUserToken2 = jwt.sign({username: u2.username}, SECRET_KEY);
  });

  test("GET all users", async () => {
    let response = await request(app)
      .get('/users')
      .send({ _token: testUserToken1 });

    expect(response.statusCode).toBe(200);
    expect(response.body.users).toContainEqual({
      username: u1.username,
      first_name: u1.first_name,
      last_name: u1.last_name,
      phone: u1.phone,
    });

  })

  test("GET all users not logged in", async () => {
    let response = await request(app)
      .get('/users');

      expect(response.statusCode).toBe(401);
  })

  test("GET single user", async () => {
    let response = await request(app)
      .get(`/users/${u1.username}`)
      .send({ _token: testUserToken1 });

      expect(response.statusCode).toBe(200);
      expect(response.body.user).toEqual({
        username: u1.username,
        first_name: u1.first_name,
        last_name: u1.last_name,
        phone: u1.phone,
        join_at: expect.any(String),
        last_login_at: expect.any(String)
      });
  })

  test("GET single user not logged in", async () => {
    let response = await request(app)
      .get(`/users/${u1.username}`);

      expect(response.statusCode).toBe(401);
  });

  test("GET messages_to logged in", async () => {
    let response = await request(app)
      .get(`/users/${u1.username}/to`)
      .send({ _token: testUserToken1 });

      expect(response.statusCode).toBe(200);
      expect(response.body.messages).toContainEqual({
        id: expect.any(Number),
        body: m2.body,
        sent_at: expect.any(String),
        read_at: null,
        from_user: expect.any(Object)
      });
  });

  test("GET messages_to wrong user", async () => {
    let response = await request(app)
      .get(`/users/${u1.username}/to`)
      .send({ _token: testUserToken2 });

      expect(response.statusCode).toBe(401);
  });

  test("GET messages_to not logged in", async () => {
    let response = await request(app)
      .get(`/users/${u1.username}/to`);

      expect(response.statusCode).toBe(401);
  });

  test("GET messages_from logged in", async () => {
    let response = await request(app)
    .get(`/users/${u1.username}/from`)
    .send({ _token: testUserToken1 });

    expect(response.statusCode).toBe(200);
    expect(response.body.messages).toContainEqual({
      body: m1.body,
      id: expect.any(Number),
      read_at: null,
      sent_at: expect.any(String),
      to_user: expect.any(Object)
    });
  })

  test("GET messages_from wrong user", async () => {
    let response = await request(app)
    .get(`/users/${u1.username}/from`)
    .send({ _token: testUserToken2 });

    expect(response.statusCode).toBe(401);
  })

  test("GET messages_from not logged in", async () => {
    let response = await request(app)
    .get(`/users/${u1.username}/from`);

    expect(response.statusCode).toBe(401);
  })
});

afterAll(async () => {
  await db.end();
})