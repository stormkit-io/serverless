module.exports = {
  verbose: false,
  roots: ["src"],
  moduleNameMapper: {
    "~(.*)$": "<rootDir>/src/$1",
  },
};
