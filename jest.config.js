module.exports = {
  verbose: false,
  roots: ["tests/unit/", "src"],
  moduleNameMapper: {
    "~(.*)$": "<rootDir>/src/$1",
  },
};
