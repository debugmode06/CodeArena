const test = require("node:test");
const assert = require("node:assert");
const {
    getJudge,
    validateProblemConfig,
    serializeValues,
    parseTokens,
    validateValues,
    emptyValue,
    TYPE_REGISTRY,
    WIRE_KINDS,
} = require("@pomelo/code-gen");

const messages = (errors) => errors.map((e) => e.message).join(" | ");

const LANGUAGES = ["c", "cpp", "java", "python"];

const COMMENT = { c: "//", cpp: "//", java: "//", python: "#" };
const DEFINITION = {
    c: "typedef struct ListNode {",
    cpp: "struct ListNode {",
    java: "class ListNode {",
    python: "class ListNode:",
};

const CONFIG = {
    method: "solve",
    input: [
        { variable: "target", type: "int" },
        { variable: "nums", type: "int_array" },
        { variable: "grid", type: "int_matrix" },
        { variable: "flag", type: "bool" },
        { variable: "head", type: "int_linked_list" },
        { variable: "ring", type: "int_linked_list_cyclic" },
        { variable: "dlist", type: "int_doubly_linked_list" },
        { variable: "root", type: "int_binary_tree" },
        { variable: "nroot", type: "int_nary_tree" },
        { variable: "wg", type: "int_weighted_graph" },
    ],
};

test("validateProblemConfig accepts a well-formed signature", () => {
    assert.deepStrictEqual(validateProblemConfig(CONFIG), []);
});

test("validateProblemConfig rejects a name colliding with a generated parameter", () => {
    const errors = validateProblemConfig({
        method: "solve",
        input: [
            { variable: "nums", type: "int_array" },
            { variable: "nums_size", type: "int" },
        ],
    });
    assert.match(errors.join(" "), /nums_size.*collides/);
});

test("generated-parameter names are derived from the readers, not a fixed suffix list", () => {
    const errors = validateProblemConfig({
        method: "solve",
        input: [
            { variable: "g", type: "int_graph" },
            { variable: "g_m", type: "int" },
        ],
    });
    assert.match(errors.join(" "), /g_m.*collides/);
});

test("validateProblemConfig rejects keywords, driver names and bad identifiers", () => {
    const cases = [
        [{ method: "main", input: [{ variable: "a", type: "int" }] }, /main/],
        [{ method: "class", input: [{ variable: "a", type: "int" }] }, /class/],
        [{ method: "solve", input: [{ variable: "iterator", type: "int" }] }, /iterator/],
        [{ method: "solve", input: [{ variable: "TreeNode", type: "int" }] }, /TreeNode/],
        [{ method: "solve", input: [{ variable: "2nd", type: "int" }] }, /2nd/],
        [{ method: "my func", input: [{ variable: "a", type: "int" }] }, /my func/],
    ];
    for (const [config, pattern] of cases) {
        assert.match(validateProblemConfig(config).join(" "), pattern);
    }
});

test("validateProblemConfig rejects duplicates and unknown types", () => {
    const errors = validateProblemConfig({
        method: "solve",
        input: [
            { variable: "a", type: "int" },
            { variable: "a", type: "int" },
            { variable: "b", type: "tree" },
        ],
    });
    assert.match(errors.join(" "), /used more than once/);
    assert.match(errors.join(" "), /Unsupported type "tree"/);
});

test("validateProblemConfig rejects two types that define one struct differently", () => {
    // both declare TreeNode, but only one has a parent field
    const conflicting = validateProblemConfig({
        method: "solve",
        input: [
            { variable: "a", type: "int_binary_tree" },
            { variable: "b", type: "int_binary_tree_parent" },
        ],
    });
    assert.match(conflicting.join(" "), /TreeNode.*different fields/);

    // int and string linked lists produce different ListNode definitions too
    const elements = validateProblemConfig({
        method: "solve",
        input: [
            { variable: "a", type: "int_linked_list" },
            { variable: "b", type: "string_linked_list" },
        ],
    });
    assert.match(elements.join(" "), /ListNode.*different fields/);

    // identical definitions may coexist
    assert.deepStrictEqual(
        validateProblemConfig({
            method: "solve",
            input: [
                { variable: "a", type: "int_linked_list" },
                { variable: "b", type: "int_linked_list_cyclic" },
                { variable: "g", type: "int_graph" },
                { variable: "d", type: "int_digraph" },
            ],
        }),
        []
    );
});

for (const lang of LANGUAGES) {
    test(`${lang} driver declares, reads and passes every variable`, () => {
        const driver = getJudge(lang).wrapCode("USER_CODE", CONFIG);

        for (const param of CONFIG.input) {
            assert.ok(driver.includes(param.variable), `${lang} driver never mentions ${param.variable}`);
        }
        assert.ok(!driver.includes("[1000]"), `${lang} driver still uses a fixed-size buffer`);
        assert.ok(driver.includes("USER_CODE"), `${lang} driver dropped the user's code`);
    });

    test(`${lang} passes C-style size params only where the signature declares them`, () => {
        const stub = getJudge(lang).generateBoilerplate(CONFIG);
        const driver = getJudge(lang).wrapCode("USER_CODE", CONFIG);
        const call = driver.split("solve(")[1].split(")")[0];

        assert.strictEqual(
            stub.includes("nums_size"),
            call.includes("nums_size"),
            `${lang} stub and call disagree about nums_size`
        );
        assert.strictEqual(lang === "c", call.includes("nums_size"));
    });

    test(`${lang} rejects an unsupported type instead of emitting broken code`, () => {
        assert.throws(
            () => getJudge(lang).wrapCode("x", { method: "solve", input: [{ variable: "t", type: "tree" }] }),
            /Unsupported type "tree"/
        );
    });

    test(`${lang} keeps replacement patterns in user code verbatim`, () => {
        const code = "const s = \"$& $` $' $1\";";
        assert.ok(getJudge(lang).wrapCode(code, CONFIG).includes(code));
    });

    test(`${lang} emits one preamble per struct, and comments it in the stub`, () => {
        const config = {
            method: "solve",
            input: [
                { variable: "a", type: "int_linked_list" },
                { variable: "b", type: "int_linked_list_cyclic" },
            ],
        };
        const judge = getJudge(lang);
        const comment = COMMENT[lang];
        const definition = DEFINITION[lang];

        // Two list parameters share one ListNode definition, so it must be emitted once.
        const live = judge.wrapCode("USER_CODE", config)
            .split("\n")
            .filter((line) => !line.trimStart().startsWith(comment));
        assert.strictEqual(
            live.filter((line) => line.trim() === definition).length,
            1,
            `${lang} driver does not define ListNode exactly once`
        );

        const stub = judge.generateBoilerplate(config).split("\n");
        assert.strictEqual(
            stub.filter((line) => line.trim() === definition).length,
            0,
            `${lang} stub declares ListNode as live code instead of a comment`
        );
        assert.ok(
            stub.some((line) => line.trim() === `${comment} ${definition}`),
            `${lang} stub never shows the ListNode definition`
        );
    });
}

test("element parameterisation changes only the element-carrying lines", () => {
    for (const lang of LANGUAGES) {
        const of = (type) =>
            getJudge(lang)
                .wrapCode("X", { method: "solve", input: [{ variable: "a", type }] })
                .split("\n");

        const asInt = of("int_linked_list");
        const asString = of("string_linked_list");

        assert.strictEqual(asInt.length, asString.length, `${lang} structure changed shape`);

        const differing = asInt.filter((line, i) => line !== asString[i]);
        assert.ok(differing.length > 0, `${lang} element type had no effect at all`);
        for (const line of differing) {
            // element-carrying lines: the val field, the _v local, or a node construction
            assert.match(line, /\bval\b|_v\b|ListNode\(/, `${lang} differs outside the element: ${line}`);
        }
    }
});

test("java hoists only real leading imports", () => {
    const code = [
        "import java.util.List;",
        "class Code {",
        '    static String s = "import java.io.File;";',
        "}",
    ].join("\n");
    const wrapped = getJudge("java").wrapCode(code, CONFIG);

    assert.ok(wrapped.startsWith("import java.util.List;"));
    assert.ok(wrapped.includes('static String s = "import java.io.File;";'));
    assert.strictEqual(wrapped.split("import java.io.File;").length, 2);
});

test("every wire kind round-trips through serialize and parse", () => {
    const values = {
        target: "9",
        nums: ["1", "2", "3"],
        grid: [["1", "2"], ["3", "4"]],
        flag: true,
        head: ["1", "2"],
        ring: { items: ["7", "8"], pos: "1" },
        dlist: ["4", "5"],
        root: ["1", "2", "null"],
        nroot: ["1", "null", "2"],
        wg: { nodes: "3", edges: [["0", "1", "5"]] },
    };

    const serialized = serializeValues(values, CONFIG.input);
    assert.deepStrictEqual(parseTokens(serialized, CONFIG.input), values);

    const kinds = new Set(CONFIG.input.map((v) => TYPE_REGISTRY[v.type].wire));
    assert.deepStrictEqual(
        [...kinds].sort(),
        ["bool", "graph", "list", "list_index", "matrix", "scalar"]
    );
});

// serializeValues must never throw — question-form.tsx serializes after the schema
// has passed, and a throw there reads to the author as "the save button does nothing".
test("serializeValues reports nothing and never throws; validateValues is the gate", () => {
    const grid = [{ variable: "grid", type: "int_matrix" }];
    assert.doesNotThrow(() => serializeValues({ grid: [["1", "2"], ["3"]] }, grid));
    assert.match(messages(validateValues({ grid: [["1", "2"], ["3"]] }, grid)), /row 2 has 1 column/);
});

test("validateValues rejects values a type cannot represent", () => {
    const cases = [
        ["ragged edges", "g", "int_graph", { nodes: "3", edges: [["0", "1"], ["2"]] }, /edge 2 needs 2 values/],
        ["endpoint past the last node", "g", "int_graph", { nodes: "3", edges: [["0", "7"]] }, /edge 1 to must be between 0 and 2/],
        ["negative node count", "g", "int_graph", { nodes: "-1", edges: [] }, /non-negative/],
        ["non-integer weight", "g", "int_weighted_graph", { nodes: "2", edges: [["0", "1", "heavy"]] }, /weight must be a whole number/],
        ["non-integer element", "nums", "int_array", ["1", "abc"], /element 2 must be a whole number/],
        ["blank scalar", "target", "int", "", /is empty/],
        ["cycle past the last node", "ring", "int_linked_list_cyclic", { items: ["1", "2"], pos: "5" }, /between -1 and 1/],
        ["null in a plain array", "nums", "int_array", ["1", "null"], /element 2 must be a whole number/],
    ];

    for (const [label, variable, type, value, pattern] of cases) {
        const errors = validateValues({ [variable]: value }, [{ variable, type }]);
        assert.match(messages(errors), pattern, `${label} was accepted`);
    }
});

test("validateValues accepts values a type can represent", () => {
    const variables = [
        { variable: "root", type: "int_binary_tree" },
        { variable: "g", type: "int_weighted_digraph" },
        { variable: "ring", type: "int_linked_list_cyclic" },
        { variable: "words", type: "string_linked_list" },
        { variable: "ratio", type: "double" },
    ];
    const values = {
        root: ["1", "null", "-3"],
        g: { nodes: "3", edges: [["0", "2", "-5"]] },
        ring: { items: ["1", "2"], pos: "-1" },
        words: ["alpha", "beta"],
        ratio: "1.5e-3",
    };

    assert.deepStrictEqual(validateValues(values, variables), []);
});

// The admin form validates the object form, serializes, and the server action then
// re-validates the serialized string. Anything valid before must stay valid after.
test("values survive serialize -> parse -> validate", () => {
    const variables = [
        { variable: "g", type: "int_digraph" },
        { variable: "wg", type: "int_weighted_graph" },
        { variable: "root", type: "int_binary_tree" },
        { variable: "ring", type: "int_linked_list_cyclic" },
        { variable: "nums", type: "int_array" },
        { variable: "flag", type: "bool" },
    ];
    const values = {
        g: { nodes: "2", edges: [["1", "1"], ["0", "0"]] },
        wg: { nodes: "3", edges: [["0", "2", "-5"]] },
        root: ["1", "null", "3"],
        ring: { items: ["1", "2"], pos: "0" },
        nums: ["4", "5"],
        flag: true,
    };

    assert.deepStrictEqual(validateValues(values, variables), []);

    const reparsed = parseTokens(serializeValues(values, variables), variables);
    assert.deepStrictEqual(validateValues(reparsed, variables), []);
});

test("a missing value is reported rather than silently serialized", () => {
    const errors = validateValues({}, [{ variable: "target", type: "int" }]);
    assert.match(messages(errors), /target has no value/);
});

test("every registered type resolves to a wire plugin and declares a token rule", () => {
    for (const [type, record] of Object.entries(TYPE_REGISTRY)) {
        assert.ok(WIRE_KINDS[record.wire], `${type} has no plugin for wire kind "${record.wire}"`);
        assert.ok(record.token, `${type} declares no token rule`);
        // emptyValue must survive a round trip, or a fresh test case renders broken.
        const variables = [{ variable: "v", type }];
        assert.doesNotThrow(
            () => parseTokens(serializeValues({ v: emptyValue(type) }, variables), variables),
            `${type} cannot round-trip its empty value`
        );
    }
});
