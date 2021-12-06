const _ = require("lodash");
const got = require("got");
const { config } = require("./config");

const api = got.extend({
  prefixUrl: "https://apptoogoodtogo.com/api/",
  headers: _.defaults(config.get("api.headers"), {
    "User-Agent":
      "TGTG/21.9.3 Dalvik/2.1.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K)",
    "Content-Type": "application/json",
    "Accept": "",
    "Accept-Language": "en-US",
    "Accept-Encoding": "gzip",
  }),
  responseType: "json",
  resolveBodyOnly: true,
});

module.exports = {
  authByEmail,
  authPoll,
  login,
  listFavoriteBusinesses,
};

function authByEmail() {
  const credentials = config.get("api.credentials");

  return api
    .post("auth/v3/authByEmail", {
      json: {
        device_type: "ANDROID",
        email: credentials.email,
      },
    });
}

function authPoll(polling_id) {
  const credentials = config.get("api.credentials");

  return api
    .post("auth/v3/authByRequestPollingId", {
      json: {
        device_type: "ANDROID",
        email: credentials.email,
        request_polling_id: polling_id,
      },
    })
    .then(createSession);
}

function login() {
  const session = getSession();
  return session.refreshToken ? refreshToken() : loginByEmail();
}

function loginByEmail() {
  const credentials = config.get("api.credentials");

  return api
    .post("auth/v3/loginByEmail", {
      json: {
        device_type: config.get("api.deviceType", "ANDROID"),
        email: credentials.email,
        password: credentials.password,
      },
    })
    .then(createSession);
}

function refreshToken() {
  const session = getSession();

  return api
    .post("auth/v3/token/refresh", {
      json: {
        refresh_token: session.refreshToken,
      },
    })
    .then(updateSession);
}

function listFavoriteBusinesses() {
  const session = getSession();

  return api.post("item/v7/", {
    json: {
      favorites_only: true,
      origin: {
        latitude: 0.0,
        longitude: 0.0,
      },
      radius: 200,
      user_id: session.userId,
    },
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}

function getSession() {
  return config.get("api.session") || {};
}

function createSession(login) {
  config.set("api.session", {
    userId: login.startup_data.user.user_id,
    accessToken: login.access_token,
    refreshToken: login.refresh_token,
  });
  return login;
}

function updateSession(token) {
  config.set("api.session.accessToken", token.access_token);
  return token;
}
