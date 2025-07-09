import crypto from "crypto";
import { v4 } from "uuid";

import { Seed } from "../src/core/seed.js";
import { makeOracleInstanceV8 } from "../src/oracle-instance.js";
import { oracleDig, oracleOpen } from "../src/oracle-utils.js";

async function executeTest(name, func, ...args) {
	async function execute() {
		const now = Date.now();
		await func(...args);
		console.log(`${name} complete ${(Date.now() - now) / 1000}s`);
	}

	return new Promise((resolve, reject) => {
		setTimeout(async() => {
			execute().then(resolve).catch(reject);
		}, 1000);
	});
}

function createRandomSeed(num) {
	const seed = Seed.make(crypto.randomBytes(32).toString("hex"));
	for (let i = 0; i < num; i++) {
		seed.transform(i);
	}
	return seed;
}

function checkSeedRanges(num) {
	const seed = createRandomSeed(2);
	const session = seed.getSession();

	const min = 50;
	const max = 100;

	{
		const value = session.getRandomIntInRange(max, max);
		if (value !== max) {
			throw new Error(`Value ${value} out of range ${max} - ${max} `);
		}
	}

	{
		try {
			const value = session.getRandomIntInRange(max, min);
			throw new Error(`Wrong result for range ${max} - ${min}: ${value}`);
		} catch (error) {

		}
	}

	for (let i = 0; i < num; i++) {
		const value = session.getRandomIntInRange(50, 100);
		if (value < min || value >= max) {
			throw new Error(`Value ${value} is out of range [${min}, ${max})`);
		}
	}
}

function checkSeedPlatformRepeatability() {
	const dataA = [ 18, 34, 64, 40, 86, 32, 57, 89, 62, 66, 27, 41, 49, 99, 61, 71, 54, 6, 47, 82 ];
	const dataB = [];
	const seed = Seed.make("test-secret-key");
	seed.transform("second-key");
	const session = seed.getSession();

	for (let i = 0; i < 20; i++) {
		const value = session.getRandomIntInRange(0, 100);
		dataB.push(value);
	}

	for (let i = 0; i < 20; i++) {
		if (dataA[i] !== dataB[i]) {
			throw new Error(`Expected ${JSON.stringify(dataB)} to equal ${JSON.stringify(dataA)}`);
		}
	}
}

function checkSeedRepeatability(num) {
	const seed = createRandomSeed(2);

	const session1 = seed.getSession();
	const session2 = seed.getSession();

	for (let i = 0; i < num; i++) {
		const value1 = session1.getRandomIntInRange(0, 100);
		const value2 = session2.getRandomIntInRange(0, 100);

		if (value1 !== value2) {
			throw new Error("Detected different result for equal sessions");
		}
	}
}

function checkSeedDistribution(num, values) {
	let max = 100;

	function addToMap(map, value) {
		map.count = (map.count || 0) + 1;
		map[value] = (map[value] || 0) + 1;
	}

	function analise(map) {
		const av = map.count / max;
		let maxDistribution = 0;

		for (let j = 0; j < max; j++) {
			const distribution = Math.abs(1 - ((map[j] || 0) / av));
			maxDistribution = Math.max(maxDistribution, distribution);

		}

		if (maxDistribution > 0.05) {
			throw new Error(`Maximum distribution should be greater than 0.05 ${maxDistribution}`);
		}
	}

	const seed = createRandomSeed(2);
	const totalDistribution = {};

	for (let i = 0; i < num; i++) {
		seed.transform(i);
		let session = seed.getSession();
		const sessionDistribution = {};

		for (let j = 0; j < values; j++) {
			const value = session.getRandomIntInRange(0, max);

			addToMap(sessionDistribution, value);
			addToMap(totalDistribution, value);
		}

		analise(sessionDistribution);
	}

	analise(totalDistribution);
}

function checkSeedCopy(num) {
	for (let i = 0; i < num; i++) {
		const seed1 = createRandomSeed(2);
		seed1.transform("first-key");
		const seed2 = seed1.copy();

		seed1.transform("second-key");
		seed2.transform("second-key");

		if (seed1.getSession().getRandomInt() !== seed2.getSession().getRandomInt()) {
			throw new Error("Copied seed is different");
		}
	}
}

function checkOracleEmpty(oracle) {
	for (let action in oracle.predictions) {
		const predictions = oracle.predictions[action];
		if (predictions.attempts !== 0) {
			throw new Error("Attempt count != 0 for action: " + action + " " + predictions.attempts);
		}
		if (predictions.promised !== 0) {
			throw new Error("Promise count != 0 for action: " + action + " " + predictions.promised);
		}
		if (predictions.quantity !== 0) {
			throw new Error("Quantity count != 0 for action: " + action + " " + predictions.quantity);
		}
	}
}

function checkOracle() {
	const salt = v4();
	
	{
		const oracle = makeOracleInstanceV8();
		const seed = createRandomSeed(2);

		for (let i = 0; i < oracle.attempts; ++i) {
			const dig = oracleDig(i, oracle, seed, salt);
			let open = null;
			if (dig.hasOpenAction) {
				open = oracleOpen(i, oracle, seed, salt);
			}
		}

		checkOracleEmpty(oracle);
	}

	{
		const oracle = makeOracleInstanceV8();
		const seed = createRandomSeed(2);

		const array = [];

		for (let i = 0; i < oracle.attempts; ++i) {
			const dig = oracleDig(i, oracle, seed, salt);
			array.push(dig);
		}

		for (let i = 0; i < oracle.attempts; ++i) {
			if (array[i].hasOpenAction) {
				const open = oracleOpen(i, oracle, seed, salt);
			}
		}

		checkOracleEmpty(oracle);
	}
}

function checkOracleRepeatability() {
	const salt = v4();
	const oracle1 = makeOracleInstanceV8();
	const seed1 = createRandomSeed(2);

	const oracle2 = makeOracleInstanceV8();
	const seed2 = seed1.copy();

	let hash1 = crypto.createHash("sha256");
	for (let i = 0; i < oracle1.attempts; ++i) {
		const dig = oracleDig(i, oracle1, seed1, salt);
		hash1.update(JSON.stringify(dig));

		let open = null;
		if (dig.hasOpenAction) {
			open = oracleOpen(i, oracle1, seed1, salt);
			hash1.update(JSON.stringify(open));
		}
	}

	checkOracleEmpty(oracle1);

	let hash2 = crypto.createHash("sha256");
	for (let i = 0; i < oracle2.attempts; ++i) {
		const dig = oracleDig(i, oracle2, seed2, salt);
		hash2.update(JSON.stringify(dig));

		let open = null;
		if (dig.hasOpenAction) {
			open = oracleOpen(i, oracle2, seed2, salt);
			hash2.update(JSON.stringify(open));
		}
	}

	checkOracleEmpty(oracle2);

	if (hash1.digest().toString("hex") !== hash2.digest().toString("hex")) {
		throw new Error("Detected different result for equal oracles");
	}
}

function checkOracleCopy() {
	const salt = v4();
	const oracle1 = makeOracleInstanceV8();
	const seed1 = createRandomSeed(2);

	let oracle2 = oracle1.copy();
	let seed2 = seed1.copy();

	let hash1 = crypto.createHash("sha256");
	for (let i = 0; i < oracle1.attempts; ++i) {
		const dig = oracleDig(i, oracle1, seed1, salt);
		hash1.update(JSON.stringify(dig));

		let open = null;
		if (dig.hasOpenAction) {
			open = oracleOpen(i, oracle1, seed1, salt);
			hash1.update(JSON.stringify(open));
		}
	}

	checkOracleEmpty(oracle1);

	let hash2 = crypto.createHash("sha256");
	for (let i = 0; i < oracle2.attempts; ++i) {
		const oracle2Copy = oracle2.copy();
		const seed2Copy = seed2.copy();
		const dig = oracleDig(i, oracle2Copy, seed2Copy, salt);
		hash2.update(JSON.stringify(dig));

		let open = null;
		if (dig.hasOpenAction) {
			open = oracleOpen(i, oracle2Copy, seed2Copy, salt);
			hash2.update(JSON.stringify(open));
		}

		oracle2 = oracle2Copy;
		seed2 = seed2Copy;
	}

	checkOracleEmpty(oracle2);

	if (hash1.digest().toString("hex") !== hash2.digest().toString("hex")) {
		throw new Error("Detected different result for equal oracles");
	}
}

export async function runOracleTest() {
	async function execute() {
		await executeTest("Check Seed Ranges", checkSeedRanges, 100);
		await executeTest("Check Seed Repeatability", checkSeedRepeatability, 100);
		await executeTest("Check Seed Platform Repeatability", checkSeedPlatformRepeatability);
		await executeTest("Check Seed Distribution", checkSeedDistribution, 10, 1000000);
		await executeTest("Check Seed Copy", checkSeedCopy, 100);

		await executeTest("Check Oracle", checkOracle);
		await executeTest("Check Oracle Repeatability", checkOracleRepeatability);
		await executeTest("Check Oracle Copy", checkOracleCopy);

		console.log("----------------");
		console.log("All test passed!");
	}

	return new Promise((resolve, reject) => {
		execute().then(resolve).catch(reject);
	});
}