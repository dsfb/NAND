/**
tick();
console.log(i(PC(c(0), false, false, false)) === 0);
tock();
console.log(i(PC(c(0), false, false, false)) === 0);
tick();
console.log(i(PC(c(0), false, true, false)) === 0);
tock();
console.log(i(PC(c(0), false, true, false)) === 1);
tick();
console.log(i(PC(c(-32123), false, true, false)) === 1);
tock();
console.log(i(PC(c(-32123), false, true, false)) === 2);
tick();
console.log(i(PC(c(-32123), true, true, false)) === 2);
tock();
console.log(i(PC(c(-32123), true, true, false)) === -32123);
tick();
console.log(i(PC(c(-32123), false, true, false)) === -32123);
tock();
console.log(i(PC(c(-32123), false, true, false)) === -32122);
tick();
console.log(i(PC(c(-32123), false, true, false)) === -32122);
tock();
console.log(i(PC(c(-32123), false, true, false)) === -32121);
tick();
console.log(i(PC(c(12345), true, false, false)) === -32121);
tock();
console.log(i(PC(c(12345), true, false, false)) === 12345);
tick();
console.log(i(PC(c(12345), true, false, true)) === 12345);
tock();
console.log(i(PC(c(12345), true, false, true)) === 0);
tick();
console.log(i(PC(c(12345), true, true, false)) === 0);
tock();
console.log(i(PC(c(12345), true, true, false)) === 12345);
tick();
console.log(i(PC(c(12345), true, true, true)) === 12345);
tock();
console.log(i(PC(c(12345), true, true, true)) === 0);
tick();
console.log(i(PC(c(12345), false, true, false)) === 0);
tock();
console.log(i(PC(c(12345), false, true, false)) === 1);
tick();
console.log(i(PC(c(12345), false, true, true)) === 1);
tock();
console.log(i(PC(c(12345), false, true, true)) === 0);
tick();
console.log(i(PC(c(0), true, true, false)) === 0);
tock();
console.log(i(PC(c(0), true, true, false)) === 0);
tick();
console.log(i(PC(c(0), false, true, false)) === 0);
tock();
console.log(i(PC(c(0), false, true, false)) === 1);
tick();
console.log(i(PC(c(22222), false, false, true)) === 1);
tock();
console.log(i(PC(c(22222), false, false, true)) === 0);
*/