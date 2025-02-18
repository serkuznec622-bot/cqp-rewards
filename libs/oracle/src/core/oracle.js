import { Seed } from "./seed.js";

export class Prediction {
	constructor(quantity, data, affectedActions = []) {
		this.quantity = quantity;
		this.data = data;
		this.affectedActions = affectedActions;
	}

	copy() {
		return new Prediction(this.quantity, this.data, this.affectedActions);
	}
}

class Predictions {
	constructor(attempts) {
		this.attempts = attempts;
		this.promised = 0;
		this.list = [];
	}

	get quantity() {
		let result = 0;
		for (let item of this.list) {
			result += item.quantity;
		}

		return result;
	}

	copy() {
		const predictions = new Predictions(this.attempts);
		predictions.promised = this.promised;
		predictions.list = this.list.map((item) => item.copy());
		return predictions;
	}
}

export const oraclePromiseType = {
	nonePromise: 0,
	truePromise: 1,
	falsePromise: 2,
};

Object.freeze(oraclePromiseType);

export class Oracle {
	static make(attempts, actions) {
		const oracle = new Oracle(attempts);
		for (let action of actions) {
			if (oracle.predictions[action] === undefined) {
				oracle.predictions[action] = new Predictions(attempts);
			} else {
				throw new Error(`Action "${action}" already added`);
			}
		}
		return oracle;
	}

	constructor(attempts) {
		this.attempts = attempts;
		this.predictions = {};

		Object.freeze(this);
	}

	addPredictions(action, quantity, data, affectedActions = []) {
		const predictions = this.predictions[action];
		if (predictions === undefined) {
			throw new Error(`Unknown action "${action}"`);
		}

		if (quantity <= 0) {
			throw new Error("Wrong quantity");
		}

		predictions.list.push(new Prediction(quantity, data, affectedActions));

		if (predictions.quantity > predictions.attempts) {
			throw new Error(`Number of predictions for "${action}" is ${predictions.quantity}, but maximum ${this.attempts}`);
		}

		for (let affectedAction of affectedActions) {
			if (affectedAction !== null) {
				const affectedPredictions = this.predictions[affectedAction];
				if (affectedPredictions === undefined) {
					throw new Error(`Unknown affected action "${affectedAction}"`);
				}

				affectedPredictions.attempts -= quantity;

				if (affectedPredictions.attempts < 0) {
					throw new Error(`Affected actions "${affectedAction}" is ${affectedPredictions.quantity}, but maximum ${this.attempts}`);
				}
			}
		}
	}

	validatePredictions(action, { minimalChance = 0 } = {}) {
		const predictions = this.predictions[action];
		if (predictions === undefined) {
			throw new Error(`Unknown action "${action}"`);
		}

		if (minimalChance > 0) {
			const currentChance = Math.floor(predictions.quantity / predictions.attempts * 100 * 100) / 100;
			if (currentChance < minimalChance) {
				if (predictions.attempts !== predictions.quantity) {
					throw new Error(`Minimal chance for action "${action}" expected: ${minimalChance.toFixed(2)} current: ${currentChance.toFixed(2)} (quantity: ${predictions.quantity} attempts: ${predictions.attempts})`);
				}
			}
		}
	}

	#rollPromise(predictions, session) {
		const attempts = predictions.attempts;
		if (attempts <= 0) {
			throw new Error(`No more attempts for action`);
		}

		const free = predictions.quantity - predictions.promised;
		if (free < 0) {
			throw new Error(`Something went wrong`);
		}

		const chance = session.getRandomIntInRange(0, attempts);

		return chance < free;
	}

	#shake(array, random) {
		let index = 0;
		for (let i = 0; i < array.length; ++i) {
			for (let j = 0; j < array.length; j++) {
				if (i !== j) {
					const mask = 1 << (index % 32);
					const bit = random & mask;
					if (bit !== 0) {
						const k = array[i];
						array[i] = array[j];
						array[j] = k;
					}
				}
				index += 1;
			}
		}
		return array;
	}

	getPromise(action, session) {
		const predictions = this.predictions[action];
		const hasPromise = this.#rollPromise(predictions, session);

		if (hasPromise) {
			predictions.promised += 1;
		}

		predictions.attempts -= 1;

		return hasPromise;
	}

	getPrediction(action, session, promiseType = oraclePromiseType.nonePromise) {
		const predictions = this.predictions[action];

		if (predictions.promised + predictions.attempts <= 0) {
			throw new Error(`No more attempts for action`);
		}

		if (predictions.promised < 0) {
			throw new Error("Something went wrong");
		}

		if (predictions.attempts < 0) {
			throw new Error("Something went wrong");
		}

		let hasPromise = null;
		if (promiseType === oraclePromiseType.nonePromise) {
			hasPromise = this.#rollPromise(predictions, session);
			predictions.attempts -= 1;
		} else if (promiseType === oraclePromiseType.truePromise) {
			hasPromise = true;
			predictions.promised -= 1;
		} else if (promiseType === oraclePromiseType.falsePromise) {
			hasPromise = false;
		}

		if (hasPromise) {
			const randomIntForShake = session.getRandomInt();
			const list = this.#shake([ ...predictions.list ], randomIntForShake);

			let passed = 0;
			const chance = session.getRandomIntInRange(0, predictions.quantity);

			for (let i = 0; i < list.length; i++) {
				const item = list[i];
				passed += item.quantity;
				if (passed > chance) {
					item.quantity -= 1;

					if (item.quantity < 0) {
						throw new Error("Something went wrong");
					}

					return {
						empty: false,
						data: item.data,
						affectedActions: item.affectedActions,
					};
				}
			}

			throw new Error("Something went wrong");
		}

		return {
			empty: true,
			data: null,
			affectedActions: [],
		};
	}

	copy() {
		const oracle = new Oracle(this.attempts);
		for (let key in this.predictions) {
			oracle.predictions[key] = this.predictions[key].copy();
		}
		return oracle;
	}
}