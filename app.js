require("dotenv").config();

// Internal routes
const rootApi    = require("./api/index"),
      isLoggedIn = require("./api/authChecker"),
      authApi    = require("./api/spotifyLogin"),
      searchApi  = require("./api/spotifySearch"),
      saveApi    = require("./api/save"),
      emailApi   = require("./api/emailCapture"),
      frontendConfigApi = require("./api/config"),
      underConstruction = require("./api/underConstruction");

// App Config
const config     = require("./config/app"),
      spotify    = require("./config/spotify");

// Services
const clientCredentialService = require("./services/clientCredential");
      
// NPM Packages
const bodyParser = require("body-parser"),
      path       = require("path"),
      helmet     = require("helmet"),
      express    = require("express"),
      app        = express();

// Append content security policy to allow Spotify images
let csp = helmet.contentSecurityPolicy.getDefaultDirectives();
csp["img-src"].push("https://*.scdn.co/");
csp["img-src"].push("https://*.spotifycdn.com");

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: csp,
}));

// Using session initialized in app config
app.use(config.session);

app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// Routes
app.use("/", underConstruction, rootApi);
app.use("/getConfig", frontendConfigApi);
app.use("/login", underConstruction, authApi);
app.use("/search", underConstruction, searchApi);
app.use("/save", isLoggedIn.viaSpotify, saveApi);
app.use("/notify-launch", emailApi);

// Static route for serving static files
app.use('/public', express.static(path.join(__dirname, 'public/dist')));

module.exports = app;

