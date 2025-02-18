import crypto from "crypto";

export class SeedSession {
	constructor(digest) {
		this.first = digest;
		this.digest = digest;
		this.index = 0;
	}

	/* return random value in range [min, max) */
	getRandomIntInRange(min, max) {
		if (min > max) {
			throw new Error("");
		}

		if (min === max) {
			return min;
		}

		const value = this.getRandomInt();
		return min + (value % (max - min));
	}

	getRandomInt() {
		const offset = this.index % 16;

		if (offset === 0) {
			this.digest = crypto.createHash("sha512")
				.update(this.first)
				.update(this.digest)
				.update(this.index.toString())
				.digest();
		}
		this.index += 1;

		return this.digest.readUInt32BE(offset * 4);
	}
}

export class Seed {
	static make(key) {
		const newSeed = new Seed();
		newSeed.transform(key);
		return newSeed;
	}

	constructor() {
		this.hash = null;
	}

	transform(key) {
		const sha256 = crypto.createHash("sha256");
		if (this.hash !== null) {
			sha256.update(this.hash);
		}
		sha256.update(key.toString());
		this.hash = sha256.digest().toString("hex");
	}

	getSession() {
		return new SeedSession(this.hash);
	}

	toString() {
		return this.hash;
	}

	copy() {
		const seed = new Seed();
		seed.hash = this.hash;
		return seed;
	}
}