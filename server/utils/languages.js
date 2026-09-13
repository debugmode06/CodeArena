// Language ids understood by the judge service.
//
// These must match the `id` fields in the judge's configs/languages.toml. Adding a
// language here without adding it there produces a 400 from the judge at submit time.
const languageIds = {
    "c": 50,
    "cpp": 54,
    "java": 62,
    "python": 71,
};

module.exports = { languageIds };
