var scale = require("../src/scale");

var test = scale({
    type: "power",
    exponent: 0.5,
    domain: [0,30000],
    range: [0, 600]
});

var tests = [
    test(3000),
    test(100),
    test(5000)
];

console.log(tests);
