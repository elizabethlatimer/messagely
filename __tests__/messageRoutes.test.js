const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const { SECRET_KEY } = require("../config")


let testUserToken1;
let testUserToken2;
let testUserToken3;
let u1, u2, u3, m1, m2;

describe("Message Routes Test", function () {
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

    u3 = await User.register({
      username: "test3",
      password: "password",
      first_name: "Test3",
      last_name: "Testy3",
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

    testUserToken1 = jwt.sign({ username: u1.username }, SECRET_KEY);
    testUserToken2 = jwt.sign({ username: u2.username }, SECRET_KEY);
    testUserToken3 = jwt.sign({ username: u3.username }, SECRET_KEY);
  });


  //tests here
  test("get single message if you are sender", async () => {
    let resp = await request(app)
      .get(`/messages/${m1.id}`)
      .send({ _token: testUserToken1 });

    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toEqual({
      id: m1.id,
      from_user: expect.any(Object),
      to_user: expect.any(Object),
      body: m1.body,
      sent_at: expect.any(String),
      read_at: null
    })
  })

  test("get single message if you are recipient", async () => {
    let resp = await request(app)
      .get(`/messages/${m1.id}`)
      .send({ _token: testUserToken2 });

    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toEqual({
      id: m1.id,
      from_user: expect.any(Object),
      to_user: expect.any(Object),
      body: m1.body,
      sent_at: expect.any(String),
      read_at: null
    })
  })
  test("can't get single message if you are not correspondent", async () => {
    let resp = await request(app)
      .get(`/messages/${m1.id}`)
      .send({ _token: testUserToken3 });

    expect(resp.statusCode).toBe(401);
  })

  test("get get single message if you are not logged in", async () => {
    let resp = await request(app)
      .get(`/messages/${m1.id}`)

    expect(resp.statusCode).toBe(401);
  })

  test("can send a message when logged in", async () => {
    let resp = await request(app)
      .post(`/messages`)
      .send({
        _token: testUserToken2,
        to_username: u1.username,
        body: "Test message from u2 to u1"
      });
    expect(resp.statusCode).toBe(201);
    expect(resp.body.message).toEqual({
      id: expect.any(Number),
      from_username: u2.username,
      to_username: u1.username,
      body: expect.any(String),
      sent_at: expect.any(String)
    })
  })

  test("can't send a message when logged out", async () => {
    let resp = await request(app)
      .post(`/messages`)
      .send({
        to_username: u1.username,
        body: "Test message from u2 to u1"
      });
      expect(resp.statusCode).toBe(401);
    })

    test("can't send a message to a user who doesn't exist", async () => {
      let resp = await request(app)
      .post(`/messages`)
      .send({
        _token: testUserToken2,
        to_username: "nobody",
        body: "Test message from u2 to to nobody"
      });
    expect(resp.statusCode).toBe(400);
  })

  test("logged in user can mark received messages as read", async () => {
    let resp = await request(app)
      .post(`/messages/${m1.id}/read`)
      .send({_token: testUserToken2});

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({"message": {id: m1.id, read_at: expect.any(String)}})
  })

  test("logged in user cannot mark sent message as read", async () => {
    let resp = await request(app)
      .post(`/messages/${m1.id}/read`)
      .send({_token: testUserToken1});

    expect(resp.statusCode).toBe(401);
  })

});

afterAll(async () => {
  await db.end();
})