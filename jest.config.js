module.exports = {
  verbose: false,
  roots: ["tests/unit/"],
  moduleNameMapper: {
    "~(.*)$": "<rootDir>/src/$1",
  },
};
