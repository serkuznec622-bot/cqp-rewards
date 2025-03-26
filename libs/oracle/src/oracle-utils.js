import { oraclePromiseType } from "./core/oracle.js";

export function seedDig(index, seed) {
	seed.transform("dig " + index);
}

export function seedOpen(index, seed) {
	seed.transform("open " + index);
}

export function seedSalt(salt, seed) {
	seed.transform("salt " + salt);
}

export function oracleDig(index, oracle, seed, salt) {
	if (salt === undefined) {
		throw new Error("Undefined salt");
	}

	seedDig(index, seed);

	if (salt !== null) {
		seedSalt(salt, seed);
	}

	let hasOpenAction = false;

	const session = seed.getSession();
	const prediction = oracle.getPrediction("dig", session);
	if (prediction.affectedActions.includes("open")) {
		hasOpenAction = false;
	} else {
		hasOpenAction = oracle.getPromise("open", session);
	}

	return {
		hasOpenAction: hasOpenAction,
		data: prediction.data,
		empty: prediction.empty,
	};
}

export function oracleOpen(index, oracle, seed, salt) {
	if (salt === undefined) {
		throw new Error("Undefined salt");
	}

	seedOpen(index, seed);

	if (salt !== null) {
		seedSalt(salt, seed);
	}

	const session = seed.getSession();
	const prediction = oracle.getPrediction("open", session, oraclePromiseType.truePromise);

	return {
		data: prediction.data,
		empty: prediction.empty,
	};
}